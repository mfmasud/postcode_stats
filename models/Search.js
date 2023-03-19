const mongoose = require("mongoose");

const atcoSchema = new mongoose.Schema({
    searchID: {
        type: Number,
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number,
    },
    postcode: {
        type: String,
    },
});

userSchema.pre("save", async function save(next) {
    if (this.isNew) {
        // if this is a new search then set the id to the next available id
        const maxId = await this.constructor.find().sort("-searchID").limit(1);
        this.searchID = maxId.length ? maxId[0].id + 1 : 1;
    }
    next();
});

module.exports = mongoose.model("Atco", atcoSchema);
