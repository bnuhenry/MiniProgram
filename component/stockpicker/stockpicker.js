const app = getApp()
const getStockInfoFromNetEase = require("../../utils/stockApi.js")

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    focusStockIdAry:{
      type:Array
    },
    bondsStockObj:{
      type:Object
    },
    bondsStockAry:{
      type:Array
    },
    stockRequestIdFromFocus:{
      type:String
    },
    openType:{
      type:Number
    },
    isMyStockAccount:{
      type:Boolean,
      value:false
    },
    cashOfMyAccount:{
      type:Number
    },
    canBondsAllClear:{
      type:Boolean,
      value:false
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    stockPickerStyle:'',
    inputStockId:Number,
    stockName:String,
    stockId:Number,
    stockRequestId:String,
    stockObj:Object,
    buy_1_amount:String,
    buy_2_amount:String,
    buy_3_amount:String,
    buy_4_amount:String,
    buy_5_amount:String,
    sell_1_amount:String,
    sell_2_amount:String,
    sell_3_amount:String,
    sell_4_amount:String,
    sell_5_amount:String,
    dealHandAmount:String,
    turnOver:String,
    increaseRate:String,
    exchangeHouseAry:['不选择','上证','深证'],
    exchangeHouse:'选择交易所',
    exchangeHouseSelected:Number,
    canFocus:false,
    canTrade:false,
    stockFocused:false,
    stockFocusedMsg:String,
    focusLoading:false,
    bonds:0,
    showStockTradeBar:0,
    howManyCanBuy:0,
    buy_price:Number,
    buy_amount:Number,
    howManyCanSell:0,
    sell_price:Number,
    sell_amount:Number,
    tradeButtonDisable:false,
    stockTradeMsg:'',
    allClearDealType:false,
  },

  //生命周期函数
  lifetimes: {
    attached: function() {
      this.setData({
        localFocusIdAry:this.data.focusStockIdAry,
        stockPickerStyle:'transform:translateY(0);',
      })
      if(this.data.openType==1){
        this.getStockInfo(this.data.stockRequestIdFromFocus);
      }
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    //点击获取股票信息按钮
    getSingleStockDetail:function(){
      const idLength = this.data.inputStockId.toString().length;
      if(idLength!=6){
        console.log('股票代码错误，应该是6位数字')
      }else{
        const requestId = this.getStockRequestId(this.data.inputStockId);
        this.getStockInfo(requestId);
      }
    },

    //获取股票代码输入框参数
    bindStockIdInput:function(e){
      this.setData({
        inputStockId: e.detail.value
      })
    },

    //获取交易所选择器参数
    bindHousePickerChange:function(e){
      const index = e.detail.value;
      this.setData({
        exchangeHouseSelected: index
      })
      switch(index){
        case '1':
          this.setData({
            exchangeHouse:'上证'
          });
          break;
        
        case '2':
          this.setData({
            exchangeHouse:'深证'
          });
          break;
        
        default:
          this.setData({
            exchangeHouse:'选择交易所'
          });
          break;
      }
    },

    //根据股票代码查询持仓头寸
    getStockBonds:function(id){
      for(let key in this.data.bondsStockObj){
        if(id == key){
          this.setData({
            bonds:this.data.bondsStockObj[key].bonds,
            howManyCanSell:this.data.bondsStockObj[key].canSell,
            canTrade:(this.data.buy_price>0||(this.data.bondsStockObj[key].bonds>0&&this.data.sell_price>0))?true:false,
          })
        }
      }
    },

    //根据股票代码加入字符串以符合网易股票数据接口要求
    getStockRequestId:function(id){
      const exchangeHouseSelected = this.data.exchangeHouseSelected;
      if(exchangeHouseSelected==1){
        return '0'+id;
      }else if(exchangeHouseSelected==2){
        return '1'+id;
      }else{
        const exChangeHouse = id.toString().substr(0,1);
        if(exChangeHouse==6){
          return '0'+id;
        }else if(exChangeHouse==0||exChangeHouse==3){
          return '1'+id;
        }
      }
    },
  
    //获取金额数字，超过一万显示万，超过亿显示亿
    getAmountStr:function(number){
      if(number>=10000 && number<100000000){
        return (number/10000).toFixed(2) + '万';
      }else if(number>=100000000){
        return (number/100000000).toFixed(2) + '亿';
      }else{
        return number;
      }
    },
  
    //获取交易手数，返回显示数据
    getHandAmountStr:function(number){
      const dealHandAmount = number/100
      if(dealHandAmount>=10000 && dealHandAmount<100000000){
        return (dealHandAmount/10000).toFixed(2) + '万手';
      }else if(dealHandAmount>=100000000){
        return (dealHandAmount/100000000).toFixed(2) + '亿手';
      }else{
        return dealHandAmount.toFixed(0)+'手';
      }
    },
  
    //获取股票涨幅
    getIncreaseRate:function(percent){
      const percentAbs = Math.abs(percent*100);
      const upOrDown = percent > 0 ? '+':'-';
      return upOrDown+Number(percentAbs).toFixed(2)+'%';
    },
  
    //ajax请求网易股票数据接口
    getStockInfo:function(stockRequestId){
      let stockObj = {};
      getStockInfoFromNetEase.getChinaStockInfo(stockRequestId).then(res=>{
        if(res){
          stockObj = res;
          stockObj = stockObj[stockRequestId];
          this.setData({
            stockObj:stockObj,
            stockRequestId:stockObj.code,
            sell_price:stockObj.bid1,
            buy_1_amount:this.getHandAmountStr(stockObj.bidvol1),
            buy_2_amount:this.getHandAmountStr(stockObj.bidvol2),
            buy_3_amount:this.getHandAmountStr(stockObj.bidvol3),
            buy_4_amount:this.getHandAmountStr(stockObj.bidvol4),
            buy_5_amount:this.getHandAmountStr(stockObj.bidvol5),
            buy_price:stockObj.ask1,
            sell_1_amount:this.getHandAmountStr(stockObj.askvol1),
            sell_2_amount:this.getHandAmountStr(stockObj.askvol2),
            sell_3_amount:this.getHandAmountStr(stockObj.askvol3),
            sell_4_amount:this.getHandAmountStr(stockObj.askvol4),
            sell_5_amount:this.getHandAmountStr(stockObj.askvol5),
            dealHandAmount:this.getHandAmountStr(stockObj.volume),
            turnOver:this.getAmountStr(stockObj.turnover),
            increaseRate:this.getIncreaseRate(stockObj.percent),
            canTrade:stockObj.ask1>0?true:false,
            canFocus:true,
          })
          this.getStockBonds(stockObj.code);
          this.getStockCanFocus(stockRequestId);
        }else{
          this.setData({
            canFocus:false
          })
        }
      })
    },

     //点击交易后请求网易股票数据接口核对价格是否准确
     getStockDeal:function(){
       this.setData({
        tradeButtonDisable:true,
       })
       let stockObj = {};
       let priceArray = [];
       let price = 0;
       let correctCount = 0;
      const stockRequestId = this.data.stockRequestId;
      const dealType = this.data.showStockTradeBar;
      getStockInfoFromNetEase.getChinaStockInfo(stockRequestId).then(res=>{
        if(res){
          stockObj = res;
          stockObj = stockObj[stockRequestId];
          if(dealType==1){
            priceArray = [stockObj.ask1,stockObj.ask2,stockObj.ask3,stockObj.ask4,stockObj.ask5];
            price = this.data.buy_price;
          }else if(dealType==2){
            priceArray = [stockObj.bid1,stockObj.bid2,stockObj.bid3,stockObj.bid4,stockObj.bid5];
            price = this.data.sell_price;
          }
          for(let i=0;i<priceArray.length;i++){
            if(price == priceArray[i]){
              this.stockTradeDone();
              correctCount++;
              break;
            }
          }
          if(correctCount==0){
            this.failDealStock('成交价格有误');
          }
        }else{
          this.failDealStock('查询不到股票信息');
          console.log('查询不到股票信息');
        }
      })
    },

    //*********交易成功回调，交易数据上传至云端,下个版本废弃*********
    dealStockDone:function(){
      const stockRequestId = this.data.stockRequestId;
      const dealType = this.data.showStockTradeBar;
      const bonds = this.data.bonds;
      const DB = wx.cloud.database();
      const _ = DB.command;
      //先是买入的情况
      if(dealType==1){
        const makeMoney = Math.floor(-(this.data.buy_amount * this.data.buy_price));
        console.log('花费'+makeMoney);
        if(bonds>0){
          wx.cloud.callFunction({
            name:'stock',
            data: {
              action: 'stockbondsrenew',
              userId:app.globalData.userId,
              stockRequestId:stockRequestId,
              price:this.data.buy_price,
              bonds:this.data.buy_amount,
              makeMoney:makeMoney,
            },
            complete:res=>{
              if(res.result.stats.updated>0){
                this.refreshStockData();
                console.log("成功买入"+this.data.stockObj.name+this.data.buy_amount+'股');
              }else{
                this.failDealStock('买入失败');
                console.log('买入失败');
              }
            }
          })
        }else if(bonds == 0){
          wx.cloud.callFunction({
            name:'stock',
            data: {
              action: 'stockbondspush',
              userId:app.globalData.userId,
              stockRequestId:stockRequestId,
              price:this.data.buy_price,
              bonds:this.data.buy_amount,
              makeMoney:makeMoney,
            },
            complete:res=>{
              if(res.result.stats.updated>0){
                this.refreshStockData();
                console.log("成功买入"+this.data.stockObj.name+this.data.buy_amount+'股');
              }else{
                this.failDealStock('买入失败');
                console.log('买入失败');
              }
            }
          })
        }else{
          wx.showToast({
            title: '交易失败',
            icon:'error',
            duration:2000
          })
          console.log('数据错误，买入失败');
        }
      }else if(dealType==2){
        const makeMoney = Math.floor(this.data.sell_amount * this.data.sell_price);
        console.log('套现'+makeMoney);
        const amount = - this.data.sell_amount;
        if(bonds>this.data.sell_amount){
          wx.cloud.callFunction({
            name:'stock',
            data: {
              action: 'stockbondsrenew',
              userId:app.globalData.userId,
              stockRequestId:stockRequestId,
              price:this.data.sell_price,
              bonds:amount,
              makeMoney:makeMoney,
            },
            complete:res=>{
              if(res.result.stats.updated>0){
                this.refreshStockData();
                console.log("成功卖出"+this.data.stockObj.name+this.data.sell_amount+'股');
              }else{
                this.failDealStock('卖出失败');
                console.log('卖出失败');
              }
            }
          })
        }else if(bonds == this.data.sell_amount){
          wx.cloud.callFunction({
            name:'stock',
            data: {
              action: 'stockbondspull',
              userId:app.globalData.userId,
              stockRequestId:stockRequestId,
              price:this.data.sell_price,
              bonds:this.data.sell_amount,
              makeMoney:makeMoney,
            },
            complete:res=>{
              if(res.result.stats.updated>0){
                this.refreshStockData();
                console.log("成功卖出"+this.data.stockObj.name+this.data.sell_amount+'股');
              }else{
                this.failDealStock('卖出失败');
                console.log('卖出失败');
              }
            }
          })
        }else{
          wx.showToast({
            title: '交易失败',
            icon:'error',
            duration:2000
          })
          console.log('数据错误，卖出失败');
        }
      }
    },

    //交易成功回调，交易数据上传至云端，新版本上线,dealType分组1是买2是卖3是全部清仓
    stockTradeDone:function(){
      const stockRequestId = this.data.stockRequestId;
      const dealType = this.data.showStockTradeBar;
      //先是买入的情况
      if(dealType==1){
        const makeMoney = Math.floor(-(this.data.buy_amount * this.data.buy_price));
        console.log('花费'+makeMoney);
        wx.cloud.callFunction({
          name:'stock',
          data: {
            action: 'stockBondsTrade',
            dealType:1,
            stockRequestId:stockRequestId,
            price:this.data.buy_price,
            bonds:this.data.buy_amount,
            userId:app.globalData.userId,
            stock_bonds_ary:this.data.bondsStockAry,
            makeMoney:makeMoney,
          },
          success:res=>{
            if(res.result.stats.updated>0){
              this.refreshStockData();
              console.log("成功买入"+this.data.stockObj.name+this.data.buy_amount+'股');
            }else{
              this.failDealStock('买入失败');
              console.log('买入失败');
            }
          },
          fail:res=>{
            wx.hideLoading();
            this.failDealStock('交易失败');
            console.log('交易失败，数据错误');
            console.log(res);
          }
        })
      //然后是卖出的情况下
      }else if(dealType==2){
        const makeMoney = Math.floor(this.data.sell_amount * this.data.sell_price);
        const amount = - this.data.sell_amount;
        console.log('套现'+makeMoney);
        wx.cloud.callFunction({
          name:'stock',
          data: {
            action: 'stockBondsTrade',
            dealType:2,
            stockRequestId:stockRequestId,
            price:this.data.sell_price,
            bonds:amount,
            userId:app.globalData.userId,
            stock_bonds_ary:this.data.bondsStockAry,
            makeMoney:makeMoney,
          },
          success:res=>{
            if(res.result.stats.updated>0){
              this.refreshStockData();
              console.log("成功卖出"+this.data.stockObj.name+this.data.sell_amount+'股');
            }else{
              this.failDealStock('卖出失败');
              console.log('卖出失败');
            }
          },
          fail:res=>{
            wx.hideLoading();
            this.failDealStock('交易失败');
            console.log('交易失败，数据错误');
            console.log(res);
          }
        })
      }
    },

    //交易成功后调用刷新数据函数
    refreshStockData:function(){
      const dealType = this.data.showStockTradeBar;
      const doingAllClear = this.data.allClearDealType;
      let title = '';
      if(doingAllClear){
        title = '全部卖出成功';
      }else if(dealType==1){
        title = '买入成功';
      }else if(dealType==2){
        title = '卖出成功';
      }
      wx.showToast({
        title: title,
        icon: 'success',
        duration: 2000
      })
      this.setData({
        allClearDealType:false,
      })
      setTimeout(()=>{
        this.triggerEvent('stockDataChanged',true);
        this.cancelStockTradeBar();
        this.cancel();
      },1500);

    },

    //交易失败回调
    failDealStock:function(errStr){
      const title = errStr;
      this.setData({
        tradeButtonDisable:false,
        stockTradeMsg:errStr,
        allClearDealType:false,
       })
      wx.showToast({
        title: title,
        icon: 'error',
        duration: 2000
      })
      setTimeout(()=>{
        this.triggerEvent('stockDataChanged',true);
        this.cancelStockTradeBar();
        this.cancel();
      },1000);
    },

    //股票交易框取消显示
    cancelStockTradeBar:function(){
      this.setData({
        showStockTradeBar:0,
      })
    },

    //点击交易按钮
    clickWantToTrade:function(){
      if(this.data.buy_price>0){
        const price = this.data.buy_price;
        this.setData({
          showStockTradeBar:1,
          howManyCanBuy:this.getHowManyCanBuy(price)
        })
        this.getStockInfo(this.data.stockRequestId);
      }else if(this.data.sell_price>0&&this.data.bonds>0){
        this.setData({
          showStockTradeBar:2,
        })
        this.getStockInfo(this.data.stockRequestId);
      }
    },

    //点击我要买入
    clickWantToBuy:function(){
      const price = this.data.buy_price;
      if(price>0){
        this.setData({
          showStockTradeBar:1,
          howManyCanBuy:this.getHowManyCanBuy(price)
        })
        this.getStockInfo(this.data.stockRequestId);
      }
    },

    //买入股票中买入价格输入框事件绑定
    bindBuyPriceInput:function(e){
      const price = e.detail.value;
      if(price>0){
        this.setData({
          buy_price:price,
          howManyCanBuy:this.getHowManyCanBuy(price)
        })
      }else{
        this.setData({
          howManyCanBuy:0
        })
      }
    },

    //买入股票中买入数量输入框事件绑定
    bindBuyAmountInput:function(e){
      const amount = e.detail.value;
      if(amount>=this.data.howManyCanBuy){
        this.setData({
          buy_amount:this.data.howManyCanBuy
        })
      }else{
        this.setData({
          buy_amount:Math.floor(amount/100)*100
        })
      }
    },

    //根据价格判断最多可以买入多少股
    getHowManyCanBuy:function(price){
      const cash = this.data.cashOfMyAccount;
      const hands = Math.floor(cash/(price*100));
      return hands*100;
    },

    //弹出交易框之后点击买入触发
    clickBuyStock:function(){
      if(this.data.buy_amount>0&&this.data.buy_price>0){
        wx.showModal({
          title:' 确认买入',
          content: '以'+this.data.buy_price+'买入'+this.data.buy_amount+'股？',
          success:res=> {
            if (res.confirm) {
              this.getStockDeal();
              console.log('正在加入购物车');
            } else if (res.cancel) {
              console.log('我再想想')
            }
          }
        })
      }else{
        this.setData({
          stockTradeMsg:'买入价格或数量为0'
        })
      }
    },

    //弹出交易框之后点击全仓买入触发
    clickAllInBuyStock:function(){
      if(this.data.howManyCanBuy>0&&this.data.buy_price>0){
        this.setData({
          buy_amount:this.data.howManyCanBuy
        })
        wx.showModal({
          title:' 确认买入',
          content: '以'+this.data.buy_price+'买入'+this.data.buy_amount+'股？',
          success:res=> {
            if (res.confirm) {
              this.getStockDeal();
              console.log('正在加入购物车');
            } else if (res.cancel) {
              console.log('我再想想')
            }
          }
        })
      }else{
        this.setData({
          stockTradeMsg:'买入价格为0或者可购买数量不足100股'
        })
      }
    },

    //点击我要卖出
    clickWantToSell:function(){
      const price = this.data.sell_price;
      if(price>0){
        this.setData({
          showStockTradeBar:2,
        })
        this.getStockInfo(this.data.stockRequestId);
      }
    },

     //卖出股票价格输入框事件绑定
     bindSellPriceInput:function(e){
      const price = e.detail.value;
      if(price>0){
        this.setData({
          sell_price:price,
        })
      }
    },

    //卖出股票数量输入框事件绑定
    bindSellAmountInput:function(e){
      const amount = e.detail.value;
      if(amount>=this.data.howManyCanSell){
        this.setData({
          sell_amount:this.data.howManyCanSell
        })
      }else{
        this.setData({
          sell_amount:Math.floor(amount/100)*100
        })
      }
    },

    //弹出交易框之后点击卖出触发
    clickSellStock:function(){
      if(this.data.sell_amount>0&&this.data.sell_price>0){
        wx.showModal({
          title:' 确认卖出',
          content: '以'+this.data.sell_price+'卖出'+this.data.sell_amount+'股？',
          success:res=> {
            if (res.confirm) {
              this.getStockDeal();
              console.log('正在卖出股票');
            } else if (res.cancel) {
              console.log('我再想想')
            }
          }
        })
      }else{
        this.setData({
          stockTradeMsg:'卖出价格或数量为0'
        })
      }
    },

    //弹出交易框之后点击全部卖出触发
    clickAllInSellStock:function(){
      if(this.data.howManyCanSell>0&&this.data.sell_price>0){
        this.setData({
          sell_amount:this.data.howManyCanSell
        })
        wx.showModal({
          title:' 确认卖出',
          content: '以'+this.data.sell_price+'卖出'+this.data.sell_amount+'股？',
          success:res=> {
            if (res.confirm) {
              this.getStockDeal();
              console.log('正在卖出股票');
            } else if (res.cancel) {
              console.log('我再想想')
            }
          }
        })
      }else{
        this.setData({
          stockTradeMsg:'卖出价格或者可卖数量为0'
        })
      }
    },

    //弹出交易框之后点击账户下持仓全部卖出回调(一键清仓)
    clickAllClearBondsStock:function(){
      if(this.data.canBondsAllClear){
        wx.showModal({
          title:' 确认一键清仓',
          content: '确认账户下所有持仓全部卖出？是否看到特殊指标而闻风丧胆？请谨慎选择此选项',
          success:res=> {
            if (res.confirm) {
              this.setData({
                allClearDealType:true,
              })
              this.getAllBondsStockSell();
              console.log('正在卖出全部持仓股票');
            } else if (res.cancel) {
              console.log('我很淡定，不会被特殊指标吓破胆')
            }
          }
        })
      }else{
        this.setData({
          stockTradeMsg:'持仓中含有今天买入或者停牌的股票'
        })
      }
    },

    //执行账户下持仓全部卖出(一键清仓)，本地先计算套现金额
    getAllBondsStockSell:function(){
      this.setData({
        tradeButtonDisable:true,
      })
      const bondsAry = this.data.bondsStockAry
      const stockIdArray = [];
      const dealRecordsAry = [];
      let stockObj = {};
      let makeMoney = 0;
      if(bondsAry.length>0){
        wx.showLoading({
          title: '加载中',
        })
        for(let i=0;i<bondsAry.length;i++){
          stockIdArray.push(bondsAry[i].id);
        }
        getStockInfoFromNetEase.getChinaStockInfo(stockIdArray).then(res=>{
          if(res){
            stockObj = res;
            let haveZeroPrice = false;
            //检查是否有股票停牌或者跌停导致买入一档价格为0，避免清仓时计算这支股票的市值为0
            for(let key in stockObj){
              if(stockObj[key].bid1 <= 0){
                haveZeroPrice = true;
              }
            }
            if(!haveZeroPrice){
              for(let i=0;i<bondsAry.length;i++){
                dealRecordsAry.push({
                  id:bondsAry[i].id,
                  buy:false,
                  amount: - bondsAry[i].bonds,
                  price:stockObj[bondsAry[i].id].bid1,
                  time:Date.now()
                });
                console.log('卖出'+bondsAry[i].bonds+'股'+stockObj[bondsAry[i].id].name+'价格'+stockObj[bondsAry[i].id].bid1+'总计'+stockObj[bondsAry[i].id].bid1*bondsAry[i].bonds);
                makeMoney += stockObj[bondsAry[i].id].bid1*bondsAry[i].bonds;
              }
              console.log('总计套现'+makeMoney);
              this.updateAllClearStockToDB(dealRecordsAry,makeMoney);
            }else{
              wx.hideLoading();
              wx.showToast({
                title: '清仓失败',
                icon:'error',
                duration:2000
              })
              this.setData({
                allClearDealType:false,
                tradeButtonDisable:false
              })
              console.log('查询到有股票买入一档价格为0，可能是由于停牌或者跌停导致');
            }
          }else{
            wx.hideLoading();
            this.setData({
              allClearDealType:false,
              tradeButtonDisable:false
            })
            console.log('查询股票数据为空');
          }
        })
      }
    },

    //一键清仓上传云数据库(云函数)
    updateAllClearStockToDB:function(dealRecordsAry,makeMoney){
      const totalMakeMoney = Math.floor(makeMoney);
      wx.cloud.callFunction({
        name:'stock',
        data: {
          action: 'stockBondsTrade',
          dealType:3,
          userId:app.globalData.userId,
          stock_bonds_ary:this.data.bondsStockAry,
          dealRecordsAry:dealRecordsAry,
          makeMoney:totalMakeMoney,
        },
        success:res=>{
          wx.hideLoading();
          if(res.result.stats.updated>0){
            this.refreshStockData();
            console.log('一键清仓成功，套现'+makeMoney);
          }else{
            this.failDealStock('一键清仓失败');
            console.log('一键清仓失败');
          }
        },
        fail:res=>{
          wx.hideLoading();
          this.failDealStock('交易失败');
          console.log('交易失败，数据错误');
          console.log(res);
        }
      })
    },

    //点击各档价位或者交易手数弹出交易框
    clickPriceTrade:function(e){
      const id = e.currentTarget.dataset.id;
      const dealType = id.substr(0,1);
      const canSell = this.data.bonds>0;
      if(this.data.isMyStockAccount&&!this.data.tradeButtonDisable&&this.data.canTrade){
        if(dealType=='s'){
          this.clickWantToBuy();
        }else if(dealType=='b'&&canSell){
          this.clickWantToSell();
        }
      }
    },

    //点击关注按钮
    clickFocusStock:function(){
      this.setData({
        focusLoading:true
      })
      setTimeout(()=>this.focusSingleStock(),1500);
    },
    
    //增加关注股票
    focusSingleStock:function(){
      if(this.data.stockRequestId){
        const DB = wx.cloud.database();
        const _ = DB.command;
        DB.collection("stock").where({
          userid:app.globalData.userId
        }).update({
          data:{
            stock_focus:_.push(this.data.stockRequestId)
          },
          success:res=>{
            if(res.stats.updated>0){
              console.log("关注成功");
              this.triggerEvent('focusStock',this.data.stockRequestId);
            }else{
              console.log("关注失败")
            }
          },
          fail:res=>{
            console.log("更新云数据失败")
          },
          complete: () => {
            this.setData({
              focusLoading:false
            })
            this.getStockCanFocus(this.data.stockRequestId);
          }
        })
      }
    },

    //点击取消关注
    clickCancelFocus:function(){
      this.setData({
        focusLoading:true
      })
      setTimeout(()=>this.cancelFocusStock(),1500);
    },

    //取消关注这支股票
    cancelFocusStock:function(){
      if(this.data.stockRequestId){
        const DB = wx.cloud.database();
        const _ = DB.command;
        DB.collection("stock").where({
          userid:app.globalData.userId
        }).update({
          data:{
            stock_focus:_.pull(this.data.stockRequestId)
          },
          success:res=>{
            if(res.stats.updated>0){
              console.log("已经取消关注");
              this.triggerEvent('cancelFocusStock',this.data.stockRequestId);
            }else{
              console.log("取消关注失败")
            }
          },
          fail:res=>{
            console.log("更新云数据失败")
          },
          complete: () => {
            this.setData({
              focusLoading:false
            })
            this.getStockCanFocus(this.data.stockRequestId);
          }
        })
      }
    },

    //获取股票代码选择关注还是取消关注
    getStockCanFocus:function(id){
      let focused = false;
      for(let i=0;i<this.data.focusStockIdAry.length;i++){
        if(id == this.data.focusStockIdAry[i]){
          focused = true;
          break;
        }
      }
      this.setData({
        stockFocused:focused,
        stockFocusedMsg:focused?'是':'否'
      })
    },

    //点击取消组件显示
    cancel:function(){
      this.triggerEvent('switchOff',false);
    }
  }
})
