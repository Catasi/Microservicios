const mongoose = require('mongoose');

const professorSchema = new mongoose.Schema({
  employeeNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  position: { 
    type: String, 
    enum: ['profesor', 'rh', 'servicios_escolares'], 
    required: true 
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Professor', professorSchema);