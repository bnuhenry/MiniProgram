// pages/rank/rank.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    userName:'',
    hasUserInfo: false,
    fundUserId:0,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    showDataAry:[],
    peaNut:0,
    xiaoCai:0,
    jianNanChun:0,
    oneFiveSevenThree:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.makeDataAry();
  },
  
  makeDataAry:function(){
    const dataAry = [];
    let userData = {};
    for(let i=0;i<8;i++){
      userData = {
        useravatar:'https://thirdwx.qlogo.cn/mmopen/vi_32/BiblaKjthHdyIiamEiaeHdE6jibfBtr6cfKBLoSLFfZWyRlb1EWk3UDZR6D3qBGKf2ljP9EbtTI4rBy4icnmiaRgsic9w/132',
        username:'中山佬',
        peaNut:this.makeResource(100),
        xiaoCai:this.makeResource(50),
        jianNanChun:this.makeResource(10),
        rank:this.makeRank(),
        rankName:''
      }
      userData.rankName = this.makeRankName(userData.rank);
      dataAry.push(userData);
    }
    dataAry.sort((a,b)=>b.rank-a.rank);
    this.setData({
      showDataAry:dataAry
    })
  },

  makeResource:function(index){
    return Math.floor(Math.random()*index);
  },

  makeRank:function(){
    return Math.floor(Math.random()*10);
  },

  makeRankName:function(rank){
    switch(rank){
      case(5): return '监事';
      case(6): return '秘书长';
      case(7): return '基金经理';
      case(8): return '副会长';
      case(9): return '会长';
      case(10): return '董事长';
      default:return '干事';
    }
  }

})