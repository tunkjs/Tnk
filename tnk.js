let tnk_uuid = 0;
const store = {}
const connects = {}
class Tnk {
    constructor(defaultData, dispatchHook = () => { }, beforeStoreHook = () => { }) {
        this._TNK_ID = tnk_uuid++
        store[this._TNK_ID] = {}
        connects[this._TNK_ID] = {}
        if (!defaultData) throw DEFAULT_DATA_ERR_MSG
        store[this._TNK_ID] = clone(defaultData)
        this._dispatchHook = dispatchHook
        this._beforeStoreHook = beforeStoreHook
        // const keys = Object.keys(store[this._TNK_ID])
        // for (let key of keys) publish(key, this._TNK_ID)
    }
    getState(path, cloneMode = Tnk.GetCloneMode) {
        const state = findNodeByPath(this._TNK_ID, path).state;
        return cloneMode ? clone(state) : state
    }
    dispatch(actionName, path, setAction, cloneMode = Tnk.SetCloneMode) {
        this._dispatchHook(actionName, path, setAction, cloneMode)
        if (typeof setAction !== 'function') throw '[tnk] you can only update store by action function '

        const res = setAction(this.getState(path, cloneMode))
        if (typeof res === 'undefined') throw UNDEFINED_ERR_MSG
        if (res && res.then) {
            res.then((res) => {
                if (typeof res === 'undefined') throw UNDEFINED_ERR_MSG
                set.call(this, res)
            })
        } else {
            set.call(this, res)
        }
        function set(res) {
            const parentNode = findNodeByPath(this._TNK_ID, path, true, true);
            const parentData = parentNode.state;
            let data = cloneMode ? clone(res) : res;
            this._beforeStoreHook(actionName, path, data)
            if (parentData && parentData.constructor === Array) {
                parentData[parseInt(parentNode.path[parentNode.path.length - 1])] = data
            } else {
                parentData[parentNode.path[parentNode.path.length - 1]] = data
            }
            const connect = connects[this._TNK_ID][actionName]
            if (!connect || !connect.length) return
            let i = connect.length
            while (i--) connect[i](Tnk.PublishCloneMode ? clone(data) : data, path)
        }
    }
    pub(actionName, data) {
        const connect = connects[this._TNK_ID][actionName]
        if (!connect || !connect.length) return
        let i = connect.length
        while (i--) connect[i](data)
    }
    sub(actionName, callback) {
        const connect = connects[this._TNK_ID][actionName] = connects[this._TNK_ID][actionName] || []
        connect.push(callback);
    }
    destroy() {
        store[this._TNK_ID] = null
        connects[this._TNK_ID] = null
    }
}

Tnk.GET_CLONE_MODE = true
Tnk.SET_CLONE_MODE = true
Tnk.PUBLISH_CLONE_MODE = true


export default Tnk

const DEFAULT_DATA_ERR_MSG = '[tnk] you should define the root keys of store by default data before you use then'
const UNDEFINED_ERR_MSG = '[tnk] you should define the root keys of store by default data before you use then'

function clone(obj) {
    if (obj && typeof obj === 'object') {
        return JSON.parse(JSON.stringify(obj))
    } else return obj
}

function findNodeByPath(uuid, path, notUndefined, parent) {
    if (!store[uuid]) throw '[tnk] the tnk was destroyed '
    if (typeof path === 'string') path = path.split('.');
    else if (!path || path.constructor !== Array) throw '[tnk]:wrong argument of getState';
    if (path.length === 1) {
        return { state: store[uuid], path };
    }
    let state = store[uuid][path[0]];
    if (state === 'undefined') throw DEFAULT_DATA_ERR_MSG
    for (var i = 1, l = path.length - (parent ? 1 : 0); i < l; i++) {
        if (path[i] && typeof state === 'object') {
            state = isNaN(path[i]) ? state[path[i]] : (state[parseInt(path[i])] || state[path[i]]);
        } else if (notUndefined) throw '[tnk] undefined in path'
    }
    return { state, path }
}
