import Promise from 'bluebird'
import gaussian from 'gaussian'
import rp from 'request-promise'
import Market from '../markets/Market.js'
// globals
const tokenA = '0x692a70d2e424a56d2c6c27aa97d1a86395877b3a'
const tokenB = '0xbbf289d846208c16edc8474705c748aff07732db'

let market = new Market({
  tokenA: tokenA,
  tokenB: tokenB,
})

let volume = 5
let temp_volume
let price = 1
let price_variance = .1
let volume_variance = 1

/*
///////////////////////////////////////////////////////////
SIMULATION LOOP
///////////////////////////////////////////////////////////
*/
export function simulationLoop() {
  return Promise.delay(5000)
  .then(() => {
    return calculateMarketParams()
  }).then(() => {
    temp_volume = volume
    return shotgun()
  }).then(() => {
    return simulationLoop()
  }).catch((error) => {
    console.log('error', error)
    Promise.delay(5000)
    .then(() => {
      return simulationLoop()
    })
  })
}

/*
///////////////////////////////////////////////////////////
CALCULATE BATCH PARAMETERS
///////////////////////////////////////////////////////////
*/

export default function calculateMarketParams() {
  return new Promise((resolve, reject) => {
    Promise.resolve(marketPrice())
    .then(() => {
      return batchVolume()
    }).then(() => {
      resolve(true)
    }).catch((error) => {
      reject(error)
    })
  })
}

export function marketPrice() {
  return new Promise((resolve, reject) => {
    Promise.resolve(bellRandom(price, price_variance))
    .then((p) => {
      console.log('new market price is', p)
      price = p
      let send_obj = {
        method: 'GET',
        uri: 'http://localhost:3000/price',
        body: {
          price: p,
          date: new Date().getTime(),
        },
        json: true
      }
      console.log('send_obj.body', send_obj.body)
      return rp(send_obj)
    }).then((result) => {
      console.log('server response', result)
      resolve(true)
    }).catch((error) => {
      reject(error)
    })
  })
}

export function marketVariance() {
  console.log('hit marketVariance')
}

export function batchVolume() {
  return new Promise((resolve, rejct) => {
    Promise.resolve(bellRandom(volume, volume_variance))
    .then((v) => {
      volume = Math.round(v)
      console.log('new volume is', volume)
      return v
    }).then((v) => {
      let send_obj = {
        method: 'GET',
        uri: 'http://localhost:3000/volume',
        body: {
          volume: v,
          date: new Date().getTime(),
        },
        json: true
      }
      console.log('send_obj.body', send_obj.body)
      return rp(send_obj)
    }).then(() => {

      resolve(true)
    }).catch((error) => {
      reject(error)
    })
  })
}

/*
///////////////////////////////////////////////////////////
SHOTGUN: TRADING BATCH
///////////////////////////////////////////////////////////
*/

export function shotgun() {
  return new Promise((resolve, reject) => {
    return Promise.delay(0)
    .then(() => {
      volume--
      return tradingEvent()
    }).then(() => {
      if(temp_volume <= 0) {
        resolve(true)
      } else {
        return shotgun()
      }
    }).catch((err) => {
      reject(err)
    })
  })
}

export function tradingEvent() {
  return new Promise((resolve, reject) => {
    Promise.resolve(tradeDirection())
    .then((d) => {
      if (d == 0) {
        return sellA(market)
      } else {
        return sellB(market)
      }
    }).then(() => {
      resolve(true)
    }).catch((error) => {
      reject(error)
    })
  })
}

let sellA_obj = {}
export function sellA(market) {
  return new Promise((resolve, reject) => {
    return Promise.delay(0)
    .then(() => {
      return bellRandom(price, price_variance)
    }).then((p) => {
      console.log('### Sell A at price', p)
      sellA_obj['price'] = p
      return flatRandom()
    }).then((q) => {
      console.log('### Sell A at quantity', q)
      sellA_obj['quantity'] = q
      console.log('sellA_obj', sellA_obj)
      return market.sellA(sellA_obj)
    }).then(() => {
      resolve(true)
    }).catch((err) => {
      reject(err)
    })
  })
}

let sellB_obj = {}
export function sellB(market) {
  return new Promise((resolve, reject) => {
    return Promise.delay(0)
    .then(() => {
      return bellRandom(price, price_variance)
    }).then((p) => {
      console.log('### Sell B at price', p)
      sellB_obj['price'] = p
      return flatRandom()
    }).then((q) => {
      console.log('### Sell B at quantity', q)
      sellB_obj['quantity'] = q
      return market.sellB(sellB_obj)
    }).then(() => {
      resolve(true)
    }).catch((err) => {
      reject(err)
    })
  })
}

/*
///////////////////////////////////////////////////////////
MATH UTILIITES
///////////////////////////////////////////////////////////
*/
export function bellRandom(mean, variance) {
  const distribution = gaussian(mean, variance)
  // Take a random sample using inverse transform sampling method.
  const sample = distribution.ppf(Math.random())
  return sample
}

export function flatRandom(mean) {
  return Math.floor(Math.random() * 100)
}

export function tradeDirection() {
  return Math.round(Math.random())
}

simulationLoop()
