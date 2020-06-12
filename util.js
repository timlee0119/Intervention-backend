const Mission = require('../models/Mission');

// his: [], dayNum: 0
// his: [x], dayNum: 1
// his: [x], dayNum: 3
// his: [x, y], dayNum: 3
// => day 0 has been evaluated(in day 1), so we need to evaluate day 1, 2
async function updateSuccessDayAndFillHistory(mission, dayNum) {
  if (dayNum === undefined) {
    dayNum = mission.days;
  }
  for (var i in mission.participants) {
    var par = mission.participants[i];
    for (var j = par.usageHistory.length - 1; j >= 0 && j < dayNum; ++j) {
      if (par.usageHistory[j] === undefined) {
        par.usageHistory[j] = 0;
        par.successDay += 1;
      } else if (par.usageHistory[j] < par.limitTime) {
        par.successDay += 1;
      }
    }
    if (par.usageHistory[dayNum] === undefined) {
      par.usageHistory[dayNum] = 0;
    }
  }
  try {
    mission.markModified('participants');
    await mission.save();
    await mission.updateBonus(dayNum);
  } catch (error) {
    console.error(error);
    // if cannot save, means mission is modified during find and save
    // And this cause versionKey error, so we replace mission with newer version
    const newerVersionMission = await Mission.findById(mission._id);
    Object.keys(newerVersionMission).forEach(k => {
      mission[k] = newerVersionMission[k];
    });
  }
}

module.exports = {
  updateSuccessDayAndFillHistory
};
