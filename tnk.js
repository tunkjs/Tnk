const store = {}
const connects = {}
export default class Tnk {
    static GET_CLONE_MODE = true
    static SET_CLONE_MODE = true
    static PUBLISH_CLONE_MODE = true
    static BEDORE_STORE_HOOK = () => {}
    static BEDORE_STORE_HOOK = () => {}
    constructor(defaultData) {
        if (!defaultData) throw '[tnk] you should define the keys of store by default data before you use then'
        Object.assign(store, defaultData)
        for(let key of store) publish(key)
    }
    get(key, cloneMode = Tnk.GetCloneMode) {
        return cloneMode ? clone(store[key]) : store[key]
    }
    set(key, setAction, cloneMode = Tnk.SetCloneMode) {
        if (typeof setAction !== 'function') throw '[tnk] setting store should use an action function '
        const res = setAction(cloneMode ? clone(store[key]) : store[key])
        if (typeof res === 'undefined') throw '[tnk] the result of action should not be undefined'
        store[key] = cloneMode ? clone(res) : res
        publish(key)
    }
    sub(key, callback) {
        const connect = connects[key] = connects[key] || [];
        connect.push(callback);
    }
}

function publish(key) {
    const value = store[key]
    const connect = connects[key]
    if (!connect || !connect.length) return
    let i = connect.length - 1
    while (i--) connect[i](Tnk.PublishCloneMode ? clone(value) : value)
}

function clone(obj) {
    if (obj && typeof obj === 'object') {
        return JSON.parse(JSON.stringify(obj))
    } else return obj
}