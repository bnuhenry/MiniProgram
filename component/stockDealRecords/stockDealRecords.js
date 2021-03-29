Component({
  // 组件的属性列表
  properties: {
    stockDealRecordsAry:{
      type:Array
    },
    userName:{
      type:String
    },
    userAvatar:{
      type:String
    },
    stockObj:{
      type:Object
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
        this.makeStockDealRecordsAry();
      }
    }
  },

  
  //  组件的方法列表
  methods: {
    //根据传入的交易记录数组和股票数据对象直接生成交易记录
    makeStockDealRecordsAry:function(){
      const stockDealRecordsAry = this.data.stockDealRecordsAry;
      const stockObj = this.data.stockObj;
      for(let i = 0;i<stockDealRecordsAry.length;i++){
        stockDealRecordsAry[i].name = stockObj[stockDealRecordsAry[i].id].name
        stockDealRecordsAry[i].dealTime = this.getDealTime(stockDealRecordsAry[i].time);
        stockDealRecordsAry[i].amountAbs = Math.abs(stockDealRecordsAry[i].amount);
      }
      stockDealRecordsAry.sort((a,b)=>b.time-a.time);
      this.setData({
        showDealRecordsAry:stockDealRecordsAry
      })
    },

    //获取时间戳生成日期
    getDealTime:function(time){
      const thisYear = new Date().getFullYear();
      const date = new Date(time);
      let Year = date.getFullYear();
      let YearStr = '';
      let Month = date.getMonth();
      let Day = date.getDate();
      let Hours = date.getHours();
      let Minutes = date.getMinutes();
      let Seconds = date.getSeconds();
      if(thisYear!=Year){
        YearStr = Year + '年';
      }
      if(Month<=8){
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
      return YearStr+Month+'月'+Day+'日'+Hours+':'+Minutes+':'+Seconds;
    },

    //点击取消组件显示
    cancel:function(){
      this.triggerEvent('switchOff',false);
    }
  }
})
