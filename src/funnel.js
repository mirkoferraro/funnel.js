(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["postal"], factory)
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory()
    } else {
        root.Funnel = factory()
    }
}(this, function () {

    function FunnelFilter(args) {
        let allowed_attributes = [
            'attr'
        ]

        let data = {
            multiple: false,
            pause: false
        }

        let config = (args) => {
            if ('undefined' === typeof args.multiple) {
                args.multiple = false
            }

            for (attr of allowed_attributes) {
                if (args[attr]) {
                    data[attr] = args[attr]
                }
            }

            validate()
        }

        let validate = () => {
            if (!data.attr) {
                throw new Error('Funnel.js - missing or invalid filter attr')
            }
        }

        let set = (type, value) => {
            if (!type) {
                throw new Error('Funnel.js - missing check type')
            }

            data.check = {
                type,
                value
            }
        }

        let pause = () => {
            data.pause = true
        }

        let unpause = () => {
            data.pause = false
        }

        let check = (item) => {
            if (item instanceof Array) {
                return item.filter(check)
            }

            if (data.pause) {
                return true
            }

            let
            item_value = undefined,
            nodes = data.attr.split('.'),
            result = false
            
            if (nodes.length) {
                item_value = item
                for (let node of nodes) {
                    if ('undefined' === typeof item_value[node]) {
                        item_value = undefined
                    } else {
                        item_value = item_value[node]
                    }
                }
            }

            if ('undefined' === typeof item_value) {
                return false
            }

            switch (data.check.type) {
                case 'true':
                    return !!item_value
                case 'false':
                    return !item_value
                case '>':
                    return item_value > data.check.value
                case '>=':
                    return item_value >= data.check.value
                case '<':
                    return item_value < data.check.value
                case '<=':
                    return item_value <= data.check.value
                case '==':
                    return item_value == data.check.value
                case '===':
                    return item_value === data.check.value
                case '!=':
                    return item_value != data.check.value
                case '!==':
                    return item_value !== data.check.value
                case 'contains':
                    return (''+item_value).indexOf(data.check.value) >= 0
                case 'length':
                    return (''+item_value).length === data.check.value
                case 'in':
                    return data.check.value.indexOf(item_value) >= 0
                case 'notin':
                    return data.check.value.indexOf(item_value) < 0
                case 'defined':
                    return item_value !== undefined
                case 'undefined':
                    return item_value === undefined
                default:
                    throw new Error('Funnel.js - invalid check type')
            }

            return false
        }

        return {
            config,
            set,
            pause,
            unpause,
            check,
            isTrue() {
                set('true')
            },
            isFalse() {
                set('false')
            },
            greaterThen(value) {
                set('>', value)
            },
            greaterOrEqual(value) {
                set('>=', value)
            },
            lessThen(value) {
                set('<', value)
            },
            lessOrEqual(value) {
                set('<=', value)
            },
            equal(value) {
                set('==', value)
            },
            notEqual(value) {
                set('!=', value)
            },
            exact(value) {
                set('===', value)
            },
            notExact(value) {
                set('!==', value)
            },
            contains(value) {
                set('contains', value)
            },
            length(value) {
                set('length', value)
            },
            isIn(value) {
                set('in', value)
            },
            notIn(value) {
                set('notin', value)
            },
            defined(value) {
                set('defined')
            },
            undefined(value) {
                set('undefined')
            },
        }
    }

    function Funnel() {
        let
        _filters = {},
        _items = [],
        _activeItems = [],
        _includes = [],
        _excludes = []

        let baseCompare = (itemA, itemB) => {
            if (itemA === itemB) {
                return 0
            }

            if (itemA > itemB) {
                return 1
            } else {
                return -1
            }
        }

        let compareItems = baseCompare

        let compareBy = (fn) => {
            if ('function' !== typeof fn) {
                let nodes = fn.split('.')
                compareItems = (itemA, itemB) => {
                    for (let node of nodes) {
                        if ('undefined' === typeof itemA[node]) {
                            itemA = undefined
                        } else {
                            itemA = itemA[node]
                        }

                        if ('undefined' === typeof itemB[node]) {
                            itemB = undefined
                        } else {
                            itemB = itemB[node]
                        }

                        if (itemA === itemB && undefined === itemA) {
                            return 0
                        } else if (undefined === itemA) {
                            return -1
                        } else if (undefined === itemB) {
                            return 1
                        }
                    }

                    return baseCompare(itemA, itemB)
                }
                return
            }

            compareItems = fn
        }

        let addItem = (item) => {
            if (!containItem(item)) {
                _items.push(item)
            }
        }

        let addItems = (items) => {
            items.forEach(addItem)
        }

        let containItem = (item) => {
            for (_item of _items) {
                if (compareItems(item, _item) === 0) {
                    return true
                }
            }

            return false
        }

        let removeItem = (item) => {
            let i = _items.indexOf(item)
            if (i >= 0) {
                _items.splice(i, 0)
            }
        }

        let removeItems = (items) => {
            items.forEach(removeItem)
        }

        let filter = (name, args) => {
            if (!name) {
                throw new Error('Funnel.js - missing filter name')
            }

            if (!_filters[name]) {
                _filters[name] = new FunnelFilter()
                if (!args) {
                    args = {}
                }
                if (!args.attr) {
                    args.attr = name
                }
            }

            if (args) {
                _filters[name].config(args)
            }

            return _filters[name]
        }

        let removeFilter = (name) => {
            if ('undefined' === typeof _filters[name]) {
                throw new Error('Funnel.js - invalid filter name')
            }

            delete _filters[name]
        }

        let hasFilter = (name) => {
            return 'undefined' !== typeof _filters[name]
        }

        let include = (item) => {
            notExclude(item)
            if (item instanceof Array) {
                _includes.push.apply(this, items)
            } else {
                _includes.push(item)
            }
        }

        let notInclude = (item) => {
            if (item instanceof Array) {
                item.forEach(notInclude)
            } else {
                let i = _includes.indexOf(item)
                if (i >= 0) {
                    _includes.splice(i, 0)
                }
            }
        }

        let isIncluded = (item) => {
            for (included of _includes) {
                if (0 === compareItems(included, item)) {
                    return true
                }
            }
            return false
            // return _includes.indexOf(item) >= 0
        }

        let exclude = (item) => {
            notInclude(item)
            if (item instanceof Array) {
                _excludes.push.apply(this, items)
            } else {
                _excludes.push(item)
            }
        }

        let notExclude = (item) => {
            if (item instanceof Array) {
                item.forEach(notExclude)
            } else {
                let i = _excludes.indexOf(item)
                if (i >= 0) {
                    _excludes.splice(i, 0)
                }
            }
        }

        let isExcluded = (item) => {
            for (excluded of _excludes) {
                if (0 === compareItems(excluded, item)) {
                    return true
                }
            }
            return false
            // return _excludes.indexOf(item) >= 0
        }

        let getActiveItems = () => {
            return _activeItems
        }

        let run = () => {
            let logic = 'and'

            _activeItems = _items.filter((item) => {
                if (isIncluded(item)) {
                    return true
                }

                if (isExcluded(item)) {
                    return false
                }

                for (name in _filters) {
                    let filter = _filters[name]
                    if ('and' === logic && !filter.check(item)) {
                        return false
                    } else if ('or' === logic && filter.check(item)) {
                        return true
                    }
                }

                return logic === 'and'
            })

            return _activeItems
        }

        return {
            compareBy,
            addItem,
            addItems,
            filter,
            removeFilter,
            include,
            notInclude,
            exclude,
            notExclude,
            getActiveItems,
            run
        }
    }

    return Funnel
}))