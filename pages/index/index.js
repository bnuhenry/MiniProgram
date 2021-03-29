const app = getApp()
const getStockInfoFromNetEase = require("../../utils/stockApi.js")
const fundUserApi = require("../../utils/loginApi.js")

Page({
  data: {
    userId:'',
    fundUserInfo:{},
    canSign:false,
    peaNut:0,
    xiaoCai:0,
    jianNanChun:0,
    oneFiveSevenThree:0,
    otherFundUsersAry:[],
    rewardFromUserObj:{},
    miningResult:'',
    signUpMsg:'签到',
    contributionResult:'',
    contriResultBool:false,
    contriSliderShow:false,
    contriButtonDisable:true,
    fundSlogan:'',
    stockIndexOption:0,
    hasStockAccount:false,
    indexSwiperIndex:Number,
  },

  onLoad: function () {
    this.checkMiniProgramVersion();
    this.getSinaFinancialNews();
    if (app.globalData.gotFundInfo) {
      this.getFundUserObjFromApp();
    }else{
      app.fundInfoReadyCbToIndex = res => {
        if(res.length>0){
          // 有返回基金会信息，直接渲染
          this.getFundUserObjFromCallBack(res);
        }else{
          // 返回基金会信息数组长度为0，证明没有此用户创建的用户数据，通知用户信息组件启动创建按钮
          this.callUserBarComponentMethod();
        }
      }
    }
  },

  onShow:function(){
    this.getStockIndex();
    this.getUSStockIndex();
    if((this.data.fundSlogan!='') && (this.data.fundSlogan != app.globalData.fundSloganInfo.words)){
      this.setData({
        fundSlogan:app.globalData.fundSloganInfo.words,
        fundSloganCreator:app.globalData.fundSloganInfo.name,
        fundSloganCreatorAvatar:app.globalData.fundSloganInfo.avatarUrl,
        fundName:app.globalData.fundSloganInfo.fund_name,
      })
    }
    this.callUserBarComponentMethod();
  },

  //从全局变量获取渲染数据
  getFundUserObjFromApp:function(){
    this.setData({
      userId: app.globalData.userId,
      peaNut:app.globalData.fundUserInfo.peanut,
      xiaoCai:app.globalData.fundUserInfo.xiaocai,
      jianNanChun:app.globalData.fundUserInfo.wine_jnc,
      oneFiveSevenThree:app.globalData.fundUserInfo.wine_1573,
      lastSignUpTime:app.globalData.fundUserInfo.last_signin_time,
      hasStockAccount:app.globalData.fundUserInfo.has_stock_account,
      fundUserInfo:app.globalData.fundUserInfo,
      contriButtonDisable:app.globalData.fundUserInfo.fund == 'other',
    })
    this.callUserBarComponentMethod();
    this.getSignEnable();
    if(app.globalData.fundUserInfo.fund != 'other'){
      this.getFundSlogan();
    }
    if(app.globalData.fundUserInfo.reward_from_otheruser.length>0){
      this.getUserIdFromResRewardRecordAry(app.globalData.fundUserInfo.reward_from_otheruser);
    }
  },

  // 从app中异步请求回调获取用户信息
  getFundUserObjFromCallBack:function(res){
    this.setData({
      userId: res[0]._id,
      peaNut:res[0].peanut,
      xiaoCai:res[0].xiaocai,
      jianNanChun:res[0].wine_jnc,
      oneFiveSevenThree:res[0].wine_1573,
      lastSignUpTime:res[0].last_signin_time,
      hasStockAccount:res[0].has_stock_account,
      fundUserInfo:res[0],
      contriButtonDisable:res[0].fund == 'other',
    })
    this.callUserBarComponentMethod();
    this.getSignEnable();
    if(app.globalData.fundUserInfo.fund != 'other'){
      this.getFundSlogan();
    }
    if(app.globalData.fundUserInfo.reward_from_otheruser.length>0){
      this.getUserIdFromResRewardRecordAry(app.globalData.fundUserInfo.reward_from_otheruser);
    }
  },

  //调用子组件userbar的方法更新他的数据
  callUserBarComponentMethod:function(){
    const userBar = this.selectComponent("#indexUserBar");
    userBar.pageTriggerRefresh();
  },
  
  //检查小程序版本
  checkMiniProgramVersion:function(){
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      if(res.hasUpdate){
        app.updateMiniProgramVersion();
        console.log('版本可更新');
      }else{
        console.log('版本为最新版本');
      }
    })
  },

  //判断是否可以签到
  getSignEnable:function(){
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const lastSignDate = new Date(this.data.lastSignUpTime);
    if(lastSignDate.getDate()!=day || lastSignDate.getMonth()!=month || lastSignDate.getFullYear()!=year){
      this.setData({
        canSign:true,
        signUpMsg:'可签到'
      })
    }else{
      this.setData({
        canSign:false,
        signUpMsg:'今日已签到'
      })
    }
  },

  //点击每日签到
  getMining:function(){
    const peanut = Math.floor(Math.random()*20);
    const xiaocai = Math.floor(Math.random()*10);
    const wine_jnc = Math.floor(Math.random()*5);
    this.setData({
      canSign:false
    })
    wx.showLoading({
      title: '签到中',
    })
    this.updateSignInfoToCloud(peanut,xiaocai,wine_jnc);
  },

  //签到调用云函数以处理并发
  updateSignInfoToCloud:function(peanut,xiaocai,wine_jnc){
    wx.cloud.callFunction({
      name:'account',
      data: {
        action: 'signUp',
        userId:app.globalData.userId,
        lastSignUpTime:this.data.lastSignUpTime,
        peanut:peanut,
        xiaocai:xiaocai,
        wine_jnc:wine_jnc
      },
      success:res=>{
        wx.hideLoading();
        fundUserApi.getFundUserInfo().then(res=>{
          this.getFundUserObjFromCallBack(res);
        });
        this.renewLocalData(peanut,xiaocai,wine_jnc);
      },
      fail:res=>{
        wx.hideLoading();
        console.log(res);
        wx.showToast({
          title: '签到失败',
          icon:'error',
          duration:2000
        })
        fundUserApi.getFundUserInfo().then(res=>{
          this.getFundUserObjFromCallBack(res);
        });
      }
    })
  },

  //通知组件方法
  showToastMsg(title){
    wx.showToast({
      title: title,
      icon: 'success',
      duration: 1000
    })
  },

  //更新本地资源信息
  renewLocalData:function(peanut,xiaocai,wine_jnc){
    if(peanut==0&&xiaocai==0&&wine_jnc==0){
      this.setData({
        canSign:false,
        signUpMsg:'今日已签到',
        miningResult:'已签到，什么鬼都没有...'
      })
      this.showToastMsg('已签到，但没有酒和下酒菜');
    }else{
      let miningResult = '得到';
      if(peanut>0){
        miningResult = miningResult+'花生'+peanut+'包 ';
      }
      if(xiaocai>0){
        miningResult = miningResult+'小菜'+xiaocai+'碟 ';
      };
      if(wine_jnc>0){
        miningResult = miningResult+'贱男春'+wine_jnc+'瓶';
      };
      this.setData({
        canSign:false,
        signUpMsg:'今日已签到',
        miningResult:miningResult
      })
      this.showToastMsg('已签到，有东西');
    }

  },

  //获取云端基金会方针政策信息
  getFundSlogan:function(){
    fundUserApi.getFundSlogan().then(res=>{
      this.setData({
        fundSlogan:res.words,
        fundSloganCreator:res.name,
        fundSloganCreatorAvatar:res.avatarUrl,
        fundName:res.fund_name,
      })
    })
  },

  //根据被捐赠情况查询用户头像和名字
  getUserIdFromResRewardRecordAry:function(recordAry){
    const rewardFromUserIdAry = [];
    for(let i=0;i<recordAry.length;i++){
      if(recordAry[i].from_system){
        continue;
      }else if(rewardFromUserIdAry.includes(recordAry[i].from_userid)){
        continue;
      }else{
        rewardFromUserIdAry.push(recordAry[i].from_userid);
      }
    }
    this.getResRewardUserObj(rewardFromUserIdAry);
  },

  //查询云端并生成捐赠用户数据对象
  getResRewardUserObj:function(userAry){
    if(userAry.length>0){
      wx.cloud.callFunction({
        name:'account',
        data:{
          action:'rewardUsers',
          userIdAry:userAry
        },
        success:res=>{
          const rewardUserAry = res.result.data;
          for(let i=0;i<rewardUserAry.length;i++){
            this.data.rewardFromUserObj[rewardUserAry[i]._id] = {
              name:rewardUserAry[i].name,
              avatarUrl:rewardUserAry[i].avatarUrl
            }
          }
          this.makeResRewardRecordAry();
        },
        fail:res=>{
          console.log(res);
        }
      })
    }else{
      this.makeResRewardRecordAry();
    }

  },

  //根据获取的其他用户信息生成被捐赠记录数组
  makeResRewardRecordAry:function(){
    const length = this.data.fundUserInfo.reward_from_otheruser.length;
    if(length>0){
      const rewardMsgAry = [];
      const rewardDetailAry = this.data.fundUserInfo.reward_from_otheruser;
      for(let i=0;i<length;i++){
        const resNumberStr = (rewardDetailAry[i].peanut>0?rewardDetailAry[i].peanut+'包花生':'')+(rewardDetailAry[i].xiaocai>0?rewardDetailAry[i].xiaocai+'碟小菜':'')+(rewardDetailAry[i].wine_jnc>0?rewardDetailAry[i].wine_jnc+'瓶贱男春':'');
        const resTimeStr = this.getRewardTimeViaStamp(rewardDetailAry[i].time);
        if(rewardDetailAry[i].from_system){
          rewardMsgAry.push({
            msg:resTimeStr+'收到'+rewardDetailAry[i].system_remarks+'送的'+resNumberStr,
            avatarUrl:''
          })
        }else{
          const userObj = this.data.rewardFromUserObj[rewardDetailAry[i].from_userid];
          rewardMsgAry.push({
            msg:resTimeStr+'收到'+userObj.name+'送的'+resNumberStr,
            avatarUrl:userObj.avatarUrl
          })
        }
      }
      this.setData({
        resRewardRecordAry:rewardMsgAry
      })
    }
  },

  //获取时间戳生成日期字符串
  getRewardTimeViaStamp:function(time){
    const newdate = new Date();
    const date = new Date(time);
    const yearStr = date.getFullYear()==newdate.getFullYear()?'':date.getFullYear()+'年';
    return yearStr+(date.getMonth()+1)+'月'+date.getDate()+'日'+date.getHours()+':'+date.getMinutes();
  },

  //指数显示区域点击A股指数
  stockIndexChinaOpition:function(){
    this.setData({
      stockIndexOption:0,
      indexSwiperIndex:0
    })
  },

  //指数显示区域点击美股指数
  stockIndexUSOpition:function(){
    this.setData({
      stockIndexOption:1,
      indexSwiperIndex:1
    })
  },

  //监听指数swiper切换
  getIndexSwiperChange:function(e){
    const swiperIndex = e.detail.current;
    this.setData({
      stockIndexOption:swiperIndex
    })
  },

  //获取A股三大指数
  getStockIndex:function(){
    let stockObj = {};
    //A股大三指数上证指数，深证成指，创业板指
    const stockIndexArray = ['0000001','1399001','1399006'];
    getStockInfoFromNetEase.getChinaStockInfo(stockIndexArray).then(res=>{
      stockObj = res;
      this.setData({
        SHStockIndex:Number(stockObj['0000001'].price).toFixed(2),
        SHIndexUp:stockObj['0000001'].percent>0?true:false,
        SHIndexRate:this.getIndexIncreaseRate(stockObj['0000001'].percent),
        SHIndexTurnOver:this.getIndexTurnOver(stockObj['0000001'].turnover),
        SZStockIndex:Number(stockObj['1399001'].price).toFixed(2),
        SZIndexUp:stockObj['1399001'].percent>0?true:false,
        SZIndexRate:this.getIndexIncreaseRate(stockObj['1399001'].percent),
        SZIndexTurnOver:this.getIndexTurnOver(stockObj['1399001'].turnover),
        CYBStockIndex:Number(stockObj['1399006'].price).toFixed(2),
        CYBIndexUp:stockObj['1399006'].percent>0?true:false,
        CYBIndexRate:this.getIndexIncreaseRate(stockObj['1399006'].percent),
        CYBIndexTurnOver:this.getIndexTurnOver(stockObj['1399006'].turnover),
      })
    })
  },

  //获取美股指数，新浪接口请求，共3个，按顺序依次为道琼斯，纳斯达克，标普500
  getUSStockIndex(){
    getStockInfoFromNetEase.getUSStockIndex().then(res=>{
      const USIndexAry = [];
      for(let i=0;i<3;i++){
        USIndexAry.push({
          stockName:res[i*2+1].split(',')[0],
          recentIndex:Number(res[i*2+1].split(',')[1]).toFixed(2),
          increaseRate:this.getUSIndexIncreaseRate(Number(res[i*2+1].split(',')[2])),
          upOrDown:Number(res[i*2+1].split(',')[2])>0,
          dealAmount:this.getIndexTurnOver(Number(res[i*2+1].split(',')[10])),
        })
      }
      this.setData({
        USIndexAry:USIndexAry
      })
    })
  },

  //获取A股指数涨跌幅
  getIndexIncreaseRate:function(percent){
    const percentAbs = Math.abs(percent*100);
    const upOrDown = percent > 0 ? '+':'-';
    return upOrDown+Number(percentAbs).toFixed(2)+'%';
  },

  //获取美股股指数涨跌幅，跟A股唯一不同就是数据直接是百分比数字，不用乘以100
  getUSIndexIncreaseRate:function(percent){
    const percentAbs = Math.abs(percent);
    const upOrDown = percent > 0 ? '+':'-';
    return upOrDown+Number(percentAbs).toFixed(2)+'%';
  },

  //获取金额数字，超过一万显示万，超过亿显示亿
  getIndexTurnOver:function(number){
    if(number>=10000 && number<100000000){
      return (number/10000).toFixed(0) + '万';
    }else if(number>=100000000){
      return (number/100000000).toFixed(0) + '亿';
    }else{
      return number;
    }
  },

  //获取新浪财经新闻
  getSinaFinancialNews:function(){
    getStockInfoFromNetEase.getSinaFinancialNews().then(res=>{
      const newsAry = [];
      for(let i=0;i<res.length;i++){
        newsAry.push({
          title:res[i].title,
          date:res[i].date,
          news_date:res[i].news_date,
        })
      }
      this.setData({
        sinaNewsAry:newsAry
      })
    })
  },

  //点击新闻链接跳转
  getNewsLink:function(e){
    const link = e.currentTarget.dataset.link;
    console.log(link);
    wx.navigateTo({
      url:link
    })
  },

  //点击捐献资源
  getContributionBoard:function(){
    this.setData({
      contriSliderShow:!this.data.contriSliderShow
    })
  },

  //获取userbar子组件回传用户信息
  getFundUserObjFromUserBar:function(e){
    if((this.data.lastSignUpTime!=e.detail[0].last_signin_time)||(this.data.fundUserInfo.contribution!=e.detail[0].contribution)){
      this.getFundUserObjFromCallBack(e.detail)
    }
  },

  //获取子组件slider传参关闭组件
  getSliderShow:function(e){
    this.setData({
      contriSliderShow:e.detail
    })
  },

  //接受子组件slider传回他的子组件stockuserpicker组件回传的其他基金会用户数组
  getOtherFundUsersAry:function(e){
    this.setData({
      otherFundUsersAry:e.detail
    })
  },

  //获取子组件slider传参捐赠物资结果回调触发重新刷新数据函数
  getContriResultBool:function(e){
    this.setData({
      contriResultBool:e.detail,
    })
    if(e.detail){
      this.setData({
        contriSliderShow:false
      })
      fundUserApi.getFundUserInfo().then(res=>{
        this.getFundUserObjFromCallBack(res);
      });
    }
  },

  //获取子组件slider传参捐赠物资结果信息
  getContriResult:function(e){
    this.setData({
      contributionResult:e.detail
    })
  },

})
