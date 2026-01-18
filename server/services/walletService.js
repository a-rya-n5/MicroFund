const Wallet = require("../models/Wallet");

exports.getWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    console.log("CREATING WALLET FOR USER:", userId.toString());
    wallet = await Wallet.create({ user: userId });
  }

  return wallet;
};

exports.creditWallet = async (userId, amount) => {
  console.log("CREDIT WALLET CALLED FOR:", userId.toString(), "AMOUNT:", amount);

  const wallet = await exports.getWallet(userId);
  wallet.balance += amount;
  await wallet.save();

  console.log("WALLET AFTER CREDIT:", wallet.balance);
  return wallet;
};

exports.debitWallet = async (userId, amount) => {
  const wallet = await exports.getWallet(userId);

  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= amount;
  await wallet.save();
  return wallet;
};
