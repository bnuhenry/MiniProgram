function getFundRankInfo(contribution){
  if(contribution<200){
    return {
      rankName:'实习生',
      nextRankName:'干事',
      rankTitleDiscrb:'初出毛炉，请多指教',
      nextRankRequireContri:200,
      nextRankLevelNeed:200
    }
  }else if(200<=contribution&&contribution<500){
    return {
      rankName:'干事',
      nextRankName:'操盘手',
      rankTitleDiscrb:'反正就是干活的',
      nextRankRequireContri:500,
      nextRankLevelNeed:300
    }
  }else if(500<=contribution&&contribution<1000){
    return {
      rankName:'操盘手',
      nextRankName:'风控专员',
      rankTitleDiscrb:'具备一定操盘实力，追涨杀跌',
      nextRankRequireContri:1000,
      nextRankLevelNeed:500
    }
  }else if(1000<=contribution&&contribution<1500){
    return {
      rankName:'风控专员',
      nextRankName:'秘书长',
      rankTitleDiscrb:'具备一定割肉能力，敢闯敢冲',
      nextRankRequireContri:1500,
      nextRankLevelNeed:500
    }
  }else if(1500<=contribution&&contribution<2500){
    return {
      rankName:'秘书长',
      nextRankName:'基金经理',
      rankTitleDiscrb:'给人一种装B的感觉',
      nextRankRequireContri:2500,
      nextRankLevelNeed:1000
    }
  }else if(2500<=contribution&&contribution<5000){
    return {
      rankName:'基金经理',
      nextRankName:'副会长',
      rankTitleDiscrb:'经历过社会毒打的人',
      nextRankRequireContri:5000,
      nextRankLevelNeed:2500
    }
  }else if(5000<=contribution&&contribution<10000){
    return {
      rankName:'副会长',
      nextRankName:'会长',
      rankTitleDiscrb:'喝酒不醉，拿起就干，信手拈来，三中全会',
      nextRankRequireContri:10000,
      nextRankLevelNeed:5000
    }
  }else if(10000<=contribution&&contribution<20000){
    return {
      rankName:'会长',
      nextRankName:'董事长',
      rankTitleDiscrb:'一句话撼动大盘的人',
      nextRankRequireContri:20000,
      nextRankLevelNeed:10000
    }
  }else if(contribution>=20000){
    return {
      rankName:'董事长',
      nextRankName:'没有更高位阶',
      rankTitleDiscrb:'指点江山，荡气回肠，俱往矣，数风流人物',
      nextRankRequireContri:0,
      nextRankLevelNeed:0
    }
  }else{
    return {
      rankName:'保安',
      nextRankName:'无法查询位阶',
      rankTitleDiscrb:'七十二路辟邪剑法',
      contriUntilNextRank:0,
      contriNeedNextRank:0,
    }
  }
}

module.exports.getFundRankInfo = getFundRankInfo;