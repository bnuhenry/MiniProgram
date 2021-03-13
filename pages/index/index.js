//index.js
//获取应用实例
const app = getApp()

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
    miningResult:'',
    lastSignUpTime:0,
    signUpMsg:'签到',
    contributionResult:'',
    contriResultBool:false,
    contriSliderShow:false,
    fundSlogan:'',
    fundSloganCreator:'',
    fundSloganCreatorAvatar:'',
    resRewardRecordAry:[],
    SHStockIndex:0,
    SHIndexUp:false,
    SZStockIndex:0,
    SZIndexUp:false,
    CYBStockIndex:0,
    CYBIndexUp:false,
  },

  onLoad: function () {
    this.checkMiniProgramVersion();
    if (app.globalData.gotFundInfo) {
      this.setData({
        userId: app.globalData.userId,
        peaNut:app.globalData.fundUserInfo.peanut,
        xiaoCai:app.globalData.fundUserInfo.xiaocai,
        jianNanChun:app.globalData.fundUserInfo.wine_jnc,
        oneFiveSevenThree:app.globalData.fundUserInfo.wine_1573,
        lastSignUpTime:app.globalData.fundUserInfo.last_signin_time,
        fundUserInfo:app.globalData.fundUserInfo,
      })
      this.getSignEnable();
      this.getOtherFundUsers();
      this.getQKFundSlogan();
    }else{
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.fundInfoReadyCbToIndex = res => {
        this.setData({
          userId: app.globalData.userId,
          peaNut:app.globalData.fundUserInfo.peanut,
          xiaoCai:app.globalData.fundUserInfo.xiaocai,
          jianNanChun:app.globalData.fundUserInfo.wine_jnc,
          oneFiveSevenThree:app.globalData.fundUserInfo.wine_1573,
          lastSignUpTime:app.globalData.fundUserInfo.last_signin_time,
          fundUserInfo:app.globalData.fundUserInfo,
        })
        this.getSignEnable();
        this.getOtherFundUsers();
        this.getQKFundSlogan();
      }
    }
  },

  onShow:function(){
    this.getStockIndex();
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
    const now = Date.now();
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const lastSignDate = new Date(this.data.lastSignUpTime);
    if(this.data.lastSignUpTime<now && (lastSignDate.getDate()!=day || lastSignDate.getMonth()!=month || lastSignDate.getFullYear()!=year)){
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
    this.updateToCloud(peanut,xiaocai,wine_jnc);
  },

  //把签到的结果上传至服务器
  updateToCloud:function(peanut,xiaocai,wine_jnc){
    const DB = wx.cloud.database();
    const _ = DB.command;
    if(peanut==0&&xiaocai==0&&wine_jnc==0){
      //花生小菜酒全部为0的情况下只更新签到时间戳
      DB.collection("account").doc(app.globalData.userId).update({
        data:{
          last_signin_time:Date.now()
        },
        success:res=>{
          wx.hideLoading();
          if(res.stats.updated>0){
            console.log("签到成功");
            this.renewLocalData(0,0,0);
          }else{
            console.log("签到失败")
            this.setData({
              canSign:true
            })
            this.showToastMsg("签到失败");
          }
        },
        fail:res=>{
          this.setData({
            canSign:true
          })
          wx.hideLoading();
          this.showToastMsg("更新云数据失败");
          console.log("更新云数据失败")
        }
      })
    }else{
      //如果花生小菜酒只要有一样数据不为0则上传更新资源数量
      DB.collection("account").doc(app.globalData.userId).update({
        data:{
          peanut:_.inc(peanut),
          xiaocai:_.inc(xiaocai),
          wine_jnc:_.inc(wine_jnc),
          last_signin_time:Date.now()
        },
        success:res=>{
          wx.hideLoading();
          if(res.stats.updated>0){
            console.log("添加资源成功");
            this.renewLocalData(peanut,xiaocai,wine_jnc);
          }else{
            this.setData({
              canSign:true
            })
            this.showToastMsg("签到失败");
            console.log("添加资源失败")
          }
        },
        fail:res=>{
          this.setData({
            canSign:true
          })
          wx.hideLoading();
          this.showToastMsg("更新云数据失败");
          console.log("更新云数据失败");
        }
      })
    }
   
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
      const newpeanut = this.data.peaNut + peanut;
      const newxiaocai = this.data.xiaoCai + xiaocai;
      const newwine_jnc = this.data.jianNanChun + wine_jnc;
      this.setData({
        peaNut:newpeanut,
        xiaoCai:newxiaocai,
        jianNanChun:newwine_jnc,
        canSign:false,
        signUpMsg:'今日已签到',
        miningResult:miningResult
      })
      this.showToastMsg('已签到，有东西');
    }

  },

  //获取云端基金会方针政策信息
  getQKFundSlogan:function(){
    wx.cloud.callFunction({
      name:'login',
      data: {
        action: 'fundslogan',
        fund:app.globalData.fundUserInfo.fund
      },
      complete:res=>{
        if(res.result.list.length>0){
          this.setData({
            fundSlogan:res.result.list[0].words,
            fundSloganCreator:res.result.list[0].name,
            fundSloganCreatorAvatar:res.result.list[0].avatarUrl,
          })
          app.globalData.fundSloganInfo = res.result.list[0];
        }else{
          console.log('获取基金会方针政策信息失败');
        }
      }
    })
  },

  //云函数查询所有除自己之外其他所有基金会用户信息
  getOtherFundUsers:function(){
    wx.cloud.callFunction({
      name:'login',
      data: {
        action: 'otherFundUsers',
        userId:app.globalData.userId,
        fund:app.globalData.fundUserInfo.fund
      },
      complete:res=>{
        if(res.result.data.length>0){
          this.setData({
            otherFundUsersAry:res.result.data
          })
          this.makeResRewardRecordAry();
        }else{
          console.log('除了你之外没有其他老板开通基金会账户...');
        }
      }
    })
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
          const userObj = this.getUserNameAndAvartarViaUserId(rewardDetailAry[i].from_userid);
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

  //根据用户id获取用户名字和头像
  getUserNameAndAvartarViaUserId:function(id){
    const otherFundUsersAry = this.data.otherFundUsersAry;
    for(let i=0;i<otherFundUsersAry.length;i++){
      if(id == otherFundUsersAry[i]._id){
        return {
          name:otherFundUsersAry[i].name,
          avatarUrl:otherFundUsersAry[i].avatarUrl
        }
      }
    }
  },

  //获取时间戳生成日期字符串
  getRewardTimeViaStamp:function(time){
    const newdate = new Date();
    const date = new Date(time);
    const yearStr = date.getFullYear()==newdate.getFullYear()?'':date.getFullYear()+'年';
    return yearStr+(date.getMonth()+1)+'月'+date.getDate()+'日'+date.getHours()+':'+date.getMinutes();
  },

  //获取三大股票指数
  getStockIndex:function(){
    let stockObj = {};
    wx.request({
      url: 'https://api.money.126.net/data/feed/0000001,1399001,1399006',
      success:res=>{
        if(res.data.split('"').length>1){
          stockObj = JSON.parse(res.data.split('_ntes_quote_callback(')[1].split(');')[0]);
          this.setData({
            SHStockIndex:Number(stockObj['0000001'].price).toFixed(2),
            SHIndexUp:stockObj['0000001'].percent>0?true:false,
            SZStockIndex:Number(stockObj['1399001'].price).toFixed(2),
            SZIndexUp:stockObj['1399001'].percent>0?true:false,
            CYBStockIndex:Number(stockObj['1399006'].price).toFixed(2),
            CYBIndexUp:stockObj['1399006'].percent>0?true:false,
          })
        }
      },
      fail:res=>{
        console.log(res);
      }
    })
  },

  //点击捐献资源
  getContributionBoard:function(){
    this.setData({
      contriSliderShow:!this.data.contriSliderShow
    })
  },

  //获取子组件slider传参关闭组件
  getSliderShow:function(e){
    this.setData({
      contriSliderShow:e.detail
    })
  },

  //接受子组件slider传回他的子组件stockuserpicker组件回传的其他基金会用户数组
  getOtherFundUserAry:function(e){
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
      app.getFundUserInfo();
    }
  },

  //获取子组件slider传参捐赠物资结果信息
  getContriResult:function(e){
    this.setData({
      contributionResult:e.detail
    })
  }
 
})
