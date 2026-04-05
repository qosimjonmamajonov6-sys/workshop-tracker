const mongoose = require('mongoose');

// --- Models ---

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'worker'], default: 'worker' },
    payRate: { type: Number, default: 0 }, // Ishbay haq stavkasi
    balance: { type: Number, default: 0 } // Ishchi balansi/oyligi
});

const RawMaterialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, required: true }, // kg, dona, m, va h.k.
    price: { type: Number, default: 0 }
});

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    stock: { type: Number, default: 0 }, // Tayyor mahsulot qoldig'i
    ingredients: [{
        material: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
        amount: { type: Number, required: true }
    }]
});

const ProductionLogSchema = new mongoose.Schema({
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['kirim', 'chiqim'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const RawMaterial = mongoose.model('RawMaterial', RawMaterialSchema);
const Product = mongoose.model('Product', ProductSchema);
const ProductionLog = mongoose.model('ProductionLog', ProductionLogSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

// --- Production Logic ---

/**
 * produceProduct - Mahsulot tayyor bo'lganda ombordan xomashyoni ayirish va ishchi haqini hisoblash
 * @param {String} productId - Mahsulot IDsi
 * @param {Number} amount - Ishlab chiqarilgan miqdor
 * @param {String} workerId - Ishchi IDsi
 */
async function produceProduct(productId, amount, workerId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(productId).populate('ingredients.material').session(session);
        if (!product) throw new Error('Mahsulot topilmadi');

        const worker = await User.findById(workerId).session(session);
        if (!worker) throw new Error('Ishchi topilmadi');

        // 1. Zaxirani tekshirish
        for (const item of product.ingredients) {
            const material = item.material;
            const neededTotal = item.amount * amount;

            if (material.quantity < neededTotal) {
                throw new Error(`Xomashyo yetarli emas: ${material.name} (Kerak: ${neededTotal}, Mavjud: ${material.quantity})`);
            }
        }

        // 2. Xomashyoni ombordan ayirish va mahsulotni qo'shish
        for (const item of product.ingredients) {
            await RawMaterial.findByIdAndUpdate(
                item.material._id, 
                { $inc: { quantity: -(item.amount * amount) } },
                { session }
            );
        }

        // Tayyor mahsulot zaxirasini oshirish
        await Product.findByIdAndUpdate(productId, { $inc: { stock: amount } }, { session });

        // 3. Ishchining hisobiga ishbay haqini qo'shish
        const bonus = amount * worker.payRate;
        await User.findByIdAndUpdate(workerId, { $inc: { balance: bonus } }, { session });

        // 4. Log yaratish
        const log = new ProductionLog({
            worker: workerId,
            product: productId,
            amount: amount
        });
        await log.save({ session });

        await session.commitTransaction();
        session.endSession();
        
        return { success: true, message: 'Ishlab chiqarish muvaffaqiyatli yakunlandi', bonus };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

module.exports = { User, RawMaterial, Product, ProductionLog, Transaction, produceProduct };
