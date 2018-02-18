# Funnel.js

Filter and sort objects

## Installation
```shell
npm install funnel.js
```

## How to use
```js
const Funnel = require('funnel.js')

// Create the funneljs object
let funnel = new Funnel()

// Setup the compare attribute for the objects
funnel.compareBy('id')

// Add some items
funnel.addItem({ id: 1, name: 'Intel Core i7', quantity: 5 })
funnel.addItem({ id: 2, name: 'Intel Core i5', quantity: 25 })
funnel.addItem({ id: 3, name: 'Intel Core i3', quantity: 0 })

// Add multiple items
funnel.addItems([
    { id: 4, name: 'AMD Ryzen 7', quantity: 42 },
    { id: 5, name: 'AMD Ryzen 5', quantity: 9 }
])

// Add a filter
funnel.filter('quantity').greaterThen(10)
funnel.filter('name').contains('Intel')

let items = funnel.run() // [ { id: 2 } ]
```