const app = getApp()
const getFundRankInfo = require("../../utils/fundRank.js")
const fundUserApi = require("../../utils/loginApi.js")

Component({
  properties:{
    fundName:String,
  },

  // 组件的初始数据
  data: {
    fundUserInfo:{},
    hasFundUserInfo:false,
    canCreateNewFundUser:false,
    rankTitle:'',
    rankTitleDiscrb:'',
    showRateBar:false,
  },

  lifetimes: {
    attached: function() {
      this.getFundUserInfo();
    }
  },

  // 组件的方法列表
  methods: {
    //获取基金会用户信息
    getFundUserInfo:function(){
      if (app.globalData.gotFundInfo) {
        this.setData({
          fundUserInfo: app.globalData.fundUserInfo,
          hasFundUserInfo:true,
          canCreateNewFundUser:app.globalData.canCreateNewFundUser,
        })
        this.data.fundUserInfo.contribution = app.globalData.fundUserInfo.contribution;
        this.getRankTitle(app.globalData.fundUserInfo.contribution);
      }
    },

    getFundUserInfoFromCB:function(res){
      if(res.length>0){
        this.setData({
          fundUserInfo: res[0],
          hasFundUserInfo:true,
          canCreateNewFundUser:false,
        })
        this.data.fundUserInfo.contribution = res[0].contribution;
        this.getRankTitle(res[0].contribution);
        this.triggerEvent('emitFundUserInfo',res);
      }else if(res.length==0){
        this.setData({
          canCreateNewFundUser:true
        })
      }
    },

    //获取微信用户头像创建基金会账户
    createNewFundUser:function(){
      wx.showModal({
        title: '创建账户',
        content: '是否创建小程序账户？需要获取微信昵称以及头像',
        success:res=> {
          if (res.confirm) {
            fundUserApi.createFundUser().then(res=>{
              this.getFundUserInfoFromCB(res);
            });
            this.setData({
              canCreateNewFundUser:false
            })
            console.log('正在创建账户');
          } else if (res.cancel) {
            console.log('不用了谢谢')
          }
        }
      })
    },

    //获取微信用户昵称头像
    renewFundUserAvatar: function(){
      wx.showModal({
        title: '更新头像',
        content: '是否替换当前微信头像至小程序头像？需要获取微信昵称以及头像信息',
        success:res=> {
          if (res.confirm) {
            fundUserApi.editAvatar().then(res=>{
              console.log(res);
              if(res.stats != undefined){
                if(res.stats.updated>0){
                  wx.showToast({
                    title: '更新头像成功',
                    icon:'success',
                    duration:2000
                  })
                  this.getFundUserInfo();
                  console.log("更新用户头像成功");
                }else{
                  wx.showToast({
                    title: '更新头像失败',
                    icon:'error',
                    duration:2000
                  })
                  console.log("更新用户头像失败");
                }
              }
            })
          } else if (res.cancel) {
            console.log('不用了谢谢')
          }
        }
      })
    },

    //通过捐赠值获取基金会位阶
    getRankTitle:function(contribution){
      const rankInfoObj = getFundRankInfo.getFundRankInfo(contribution);
      const nextRankFinishPercent = ((contribution-(rankInfoObj.nextRankRequireContri-rankInfoObj.nextRankLevelNeed))*100/rankInfoObj.nextRankLevelNeed).toFixed(1);
      this.setData({
        rankTitle : rankInfoObj.rankName,
        rankTitleDiscrb:rankInfoObj.rankTitleDiscrb,
        nextRankName:rankInfoObj.nextRankName,
        showRateBar:contribution<20000,
        rateBarStyle:'width:'+nextRankFinishPercent+'%;',
        nextRankFinishPercent:nextRankFinishPercent+'%',
        rankImage:rankInfoObj.rankImage,
      })
    },

    //点击刷新用户信息按钮
    refreshUserInfoButton:function(){
      if(app.globalData.gotFundInfo){
        this.getFundUserInfo();
      }else{
        fundUserApi.getFundUserInfo().then(res=>{
          this.getFundUserInfoFromCB(res);
        })
      }
    },

    //父组件调用方法刷新数据
    pageTriggerRefresh:function(){
      if(app.globalData.gotFundInfo){
        if(app.globalData.fundUserInfo.contribution!=this.data.fundUserInfo.contribution||app.globalData.fundUserInfo.name!=this.data.fundUserInfo.name||app.globalData.fundUserInfo.fund!=this.data.fundUserInfo.fund||app.globalData.fundUserInfo.avatarUrl!=this.data.fundUserInfo.avatarUrl){
          this.getFundUserInfo();
        }
      }else if(app.globalData.canCreateNewFundUser){
        this.setData({
          canCreateNewFundUser:true
        })
      }
    }
  }
})
