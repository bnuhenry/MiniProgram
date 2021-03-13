// component/otheruserpicker/otheruserpicker.js
const app = getApp()
const getFundRankInfo = require("../../utils/fundRank.js")

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    checkUserType:{
      type:String,
    },
    otherFundUsersAry:{
      type:Array,
    },
    otherStockUsersAryFromStock:{
      type:Array,
    },
  },

  //组件的初始数据
  data: {
    stockUserStyle:'',
    otherUsersAry:[],
    otherUserPickerTitle:'',
  },

  //生命周期
  lifetimes: {
    attached: function() {
      this.setData({
        stockUserStyle:'transform:translateY(0);',
      })
      if(this.data.checkUserType == 'stock'){
        this.setData({
          otherUserPickerTitle:'可查询模拟盘用户'
        })
        if(this.data.otherStockUsersAryFromStock.length>0){
          this.setData({
            otherFundUsersAry:this.data.otherStockUsersAryFromStock
          })
          this.makeOtherUserAry(this.data.otherFundUsersAry);
        }else{
          this.getOtherStockUsers();
        }
      }else if(this.data.checkUserType == 'fund'){
        this.setData({
          otherUserPickerTitle:'可捐赠基金会用户'
        })
        if(this.data.otherFundUsersAry.length>0){
          this.makeOtherUserAry(this.data.otherFundUsersAry);
        }else{
          this.getOtherFundUsers();
        }
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    //云函数查询所有除自己之外其他所有模拟盘股票账户信息
    getOtherStockUsers:function(){
      wx.cloud.callFunction({
        name:'stock',
        data: {
          action: 'otherStockUsers',
          userId:app.globalData.userId,
        },
        complete:res=>{
          if(res.result.data.length>0){
            this.makeOtherUserAry(res.result.data);
            this.triggerEvent('otherStockUserAry',res.result.data);
          }else{
            console.log('除了你之外没有其他老板开通模拟盘账户...');
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
        },
        complete:res=>{
          if(res.result.data.length>0){
            this.makeOtherUserAry(res.result.data);
            this.triggerEvent('otherFundUserAry',res.result.data);
          }else{
            console.log('除了你之外没有其他老板开通基金会账户...');
          }
        }
      })
    },

    //根据获取的用户数组生成渲染数组
    makeOtherUserAry:function(array){
      const usersAry = array;
      for(let i=0;i<array.length;i++){
        usersAry[i].rankName = getFundRankInfo.getFundRankInfo(array[i].contribution).rankName;
      }
      this.setData({
        otherUsersAry:usersAry
      })
    },

    //点击具体用户信息回传用户信息对象到父组件
    clickOtherUserDetail:function(e){
      const uid = e.currentTarget.dataset.uid;
      this.triggerEvent('otherUserObj',this.data.otherUsersAry[uid]);
      this.cancel();
    },

    //点击取消组件显示
    cancel:function(){
      this.triggerEvent('switchOff',false);
    }
  }
})
