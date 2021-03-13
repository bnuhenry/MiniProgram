// component/stockDealRecords/stockDealRecords.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    stockDealRecordsAry:{
      type:Array
    },
    userName:{
      type:String
    },
    userAvatar:{
      type:String
    }
  },


  //  组件的初始数据
  data: {
    showDealRecordsAry:[],
  },

  //生命周期
  lifetimes: {
    attached: function() {
      this.setData({
        stockDealRecordsStyle:'transform:translateY(0);',
      })
      if(this.data.stockDealRecordsAry.length>0){
        this.makeStockRequestIdAry();
      }
    }
  },

  
  //  组件的方法列表
  methods: {
    //根据传入的交易记录生成股票请求id数组
    makeStockRequestIdAry:function(){
      const idAry = [];
      const recordsAry = this.data.stockDealRecordsAry;
      for(let i = 0;i<recordsAry.length;i++){
        if(idAry.includes(recordsAry[i].id)){
          continue;
        }else{
          idAry.push(recordsAry[i].id);
        }
      }
      this.getStockInfo(idAry);
    },

    //根据股票id数组请求网易数据接口
    getStockInfo:function(array){
      wx.showLoading({
        title: '加载中',
      })
      let stockObj = {};
      const stockDealRecordsAry = this.data.stockDealRecordsAry;
      const showDealRecordsAry = [];
      const url = 'https://api.money.126.net/data/feed/'+array;
      wx.request({
        url: url,
        success:res=>{
          wx.hideLoading();
          if(res.data.split('"').length>1){
            stockObj = JSON.parse(res.data.split('_ntes_quote_callback(')[1].split(');')[0]);
            for(let i = 0;i<stockDealRecordsAry.length;i++){
              stockDealRecordsAry[i].name = stockObj[stockDealRecordsAry[i].id].name
              stockDealRecordsAry[i].dealTime = this.getDealTime(stockDealRecordsAry[i].time);
              stockDealRecordsAry[i].amountAbs = Math.abs(stockDealRecordsAry[i].amount);
            }
            stockDealRecordsAry.sort((a,b)=>b.time-a.time);
            this.setData({
              showDealRecordsAry:stockDealRecordsAry
            })
          }else{
            console.log('网易股票数据接口返回空值');
          }
        },
        fail:res=>{
          wx.hideLoading();
          console.log(res);
        }
      })
    },

    //获取时间戳生成日期
    getDealTime:function(time){
      const date = new Date(time);
      let Month = date.getMonth();
      let Day = date.getDate();
      let Hours = date.getHours();
      let Minutes = date.getMinutes();
      let Seconds = date.getSeconds();
      if(Month<8){
        Month = '0'+(Month+1)
      }else{
        Month += 1;
      }
      if(Day<10){
        Day = '0' + Day;
      }
      if(Hours<10){
        Hours = '0' + Hours;
      }
      if(Minutes<10){
        Minutes = '0' + Minutes;
      }
      if(Seconds<10){
        Seconds = '0' + Seconds;
      }
      // return date.getFullYear() +'年'+(date.getMonth()+1)+'月'+date.getDate()+'日'+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
      return date.getFullYear() +'年'+Month+'月'+Day+'日'+Hours+':'+Minutes+':'+Seconds;
    },

    //点击取消组件显示
    cancel:function(){
      this.triggerEvent('switchOff',false);
    }
  }
})
