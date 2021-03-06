const mongoose = require('mongoose');
const ShortId = require('mongoose-shortid-nodeps');
const ParticipantSchema = require('./Participant').schema;

const missionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  days: { type: Number, required: true },
  money: { type: Number, required: true },
  participants: {
    type: [ParticipantSchema],
    validate: [validateParticipants, 'Participants length should be 1 or 2']
  },
  code: {
    type: ShortId,
    index: true
  },
  startTime: { type: Date }
});

function validateParticipants(val) {
  return val.length >= 1 && val.length <= 2;
}

missionSchema.virtual('endTime').get(function () {
  if (!this.startTime) {
    return undefined;
  }
  var endTime = new Date(this.startTime);
  endTime.setDate(this.startTime.getDate() + this.days);
  return endTime;
});

missionSchema.virtual('ended').get(function () {
  if (!this.startTime) {
    return undefined;
  }
  var endTime = new Date(this.startTime);
  endTime.setDate(this.startTime.getDate() + this.days);
  var now = new Date();
  return endTime < now;
});

missionSchema.methods.updateBonus = async function (dayNum) {
  if (dayNum === 0) {
    return this;
  }
  const mission = this;
  var s1 = mission.participants[0].successDay;
  var s2 = mission.participants[1].successDay;
  mission.participants[0].bonus =
    Math.floor(mission.money / (2 * mission.days)) * (dayNum + s1 - s2);
  mission.participants[1].bonus =
    Math.floor(mission.money / (2 * mission.days)) * (dayNum + s2 - s1);
  try {
    mission.markModified('participants');
    await mission.save();
  } catch (error) {
    console.error(error);
  }
  return mission;
};

missionSchema.set('toObject', { virtuals: true });
missionSchema.set('toJSON', { virtuals: true });

// WARNING: might cause performance issue, could be fixed by direct update
missionSchema.pre('save', function (next) {
  // TODO: dont mark friend, otherwise versionkey error would be frequent
  // this.markModified('participants');
  next();
});

const Mission = mongoose.model('Mission', missionSchema);

module.exports = Mission;
