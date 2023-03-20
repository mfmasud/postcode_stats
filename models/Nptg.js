// Nptg = National Public Transport Gazetteer - Location names in England, Scotland and Wales.
const mongoose = require('mongoose');

const NptgSchema = new mongoose.model.schema({
    NptgLocalityCode: {
        type: String,
        required: true,
    },
    Easting: {
        type: Number,
        required: true,
    },
    Northing: {
        type: Number,
        required: true,
    },
    LocalityName: {
        type: String,
        required: true,
    },
    QualifierName: {
        type: String,
        required: true,
    },
    ParentLocalityName: {
        type: String,
        required: true,
    },
    
});


module.exports = mongoose.model("Nptg", NptgSchema);