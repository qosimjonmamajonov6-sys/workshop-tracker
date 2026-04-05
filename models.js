const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// --- Database Connection ---
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/workshop';
const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: process.env.NODE_ENV === 'production' ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {}
});

// --- Models ---

const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'worker'), defaultValue: 'worker' },
    payRate: { type: DataTypes.FLOAT, defaultValue: 0 },
    balance: { type: DataTypes.FLOAT, defaultValue: 0 }
});

const RawMaterial = sequelize.define('RawMaterial', {
    name: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.FLOAT, defaultValue: 0 },
    unit: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, defaultValue: 0 }
});

const Product = sequelize.define('Product', {
    name: { type: DataTypes.STRING, allowNull: false },
    stock: { type: DataTypes.FLOAT, defaultValue: 0 },
    ingredients: { type: DataTypes.JSONB, defaultValue: [] }
    /* 
    Ingredients format: 
    [{ materialId: 1, amount: 1.5 }]
    */
});

const ProductionLog = sequelize.define('ProductionLog', {
    amount: { type: DataTypes.FLOAT, allowNull: false },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Associations
ProductionLog.belongsTo(User, { as: 'worker' });
ProductionLog.belongsTo(Product, { as: 'product' });

const Transaction = sequelize.define('Transaction', {
    type: { type: DataTypes.ENUM('kirim', 'chiqim'), allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    description: { type: DataTypes.STRING },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// --- Production Logic ---

/**
 * produceProduct - Mahsulot tayyor bo'lganda ombordan xomashyoni ayirish va ishchi haqini hisoblash
 * @param {Number} productId - Mahsulot IDsi
 * @param {Number} amount - Ishlab chiqarilgan miqdor
 * @param {Number} workerId - Ishchi IDsi
 */
async function produceProduct(productId, amount, workerId) {
    const t = await sequelize.transaction();

    try {
        const product = await Product.findByPk(productId, { transaction: t });
        if (!product) throw new Error('Mahsulot topilmadi');

        const worker = await User.findByPk(workerId, { transaction: t });
        if (!worker) throw new Error('Ishchi topilmadi');

        // 1. Zaxirani tekshirish
        for (const item of product.ingredients) {
            const material = await RawMaterial.findByPk(item.materialId, { transaction: t });
            if (!material) throw new Error(`Xomashyo topilmadi (ID: ${item.materialId})`);
            
            const neededTotal = item.amount * amount;
            if (material.quantity < neededTotal) {
                throw new Error(`Xomashyo yetarli emas: ${material.name} (Kerak: ${neededTotal}, Mavjud: ${material.quantity})`);
            }
        }

        // 2. Xomashyoni ombordan ayirish
        for (const item of product.ingredients) {
            const material = await RawMaterial.findByPk(item.materialId, { transaction: t });
            material.quantity -= (item.amount * amount);
            await material.save({ transaction: t });
        }

        // Tayyor mahsulot zaxirasini oshirish
        product.stock += amount;
        await product.save({ transaction: t });

        // 3. Ishchining hisobiga ishbay haqini qo'shish
        const bonus = amount * worker.payRate;
        worker.balance += bonus;
        await worker.save({ transaction: t });

        // 4. Log yaratish
        await ProductionLog.create({
            workerId: worker.id,
            productId: product.id,
            amount: amount
        }, { transaction: t });

        await t.commit();
        return { success: true, message: 'Ishlab chiqarish muvaffaqiyatli yakunlandi', bonus };

    } catch (error) {
        await t.rollback();
        throw error;
    }
}

module.exports = { sequelize, User, RawMaterial, Product, ProductionLog, Transaction, produceProduct };
