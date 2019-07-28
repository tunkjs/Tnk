export default class MediatorX {
    protected subscribers: { [key: string]: Subscriber[] } = {}
    protected store: Store
    protected isolation: boolean

    constructor(store: Store, isolation: boolean = true) {
        this.isolation = isolation
        if (!store) throw DEFAULT_DATA_ERR_MSG
        this.store = this.clone(store) as Store
    }
    public getState(fieldName: string) {
        return this.clone(this.store[fieldName])
    }
    public setState(
        actionName: string,
        fieldName: string,
        newState: State,
        isolation?: boolean
    ) {
        if (typeof this.store[fieldName] === 'undefined') {
            throw new Error(
                `[MediatorX] field name should be one of ${Object.keys(
                    this.store
                )}`
            )
        }
        this.store[fieldName] = this.clone(newState, isolation)
        const subscribers = this.subscribers[actionName]
        if (!subscribers || !subscribers.length) return
        let i = subscribers.length
        while (i--) subscribers[i](this.clone(newState, isolation))
    }
    public pub(channel: string, data: PlainObject) {
        const subscribers = this.subscribers[channel]
        if (!subscribers || !subscribers.length) return
        let i = subscribers.length
        while (i--) subscribers[i](this.clone(data))
    }
    public sub(channel: string, subscriber: Subscriber) {
        const subscribers = (this.subscribers[channel] =
            this.subscribers[channel] || [])
        subscribers.push(subscriber)
    }

    public destroy() {
        this.store = {}
        this.subscribers = {}
    }

    protected clone(
        state: State | Store,
        isolation: boolean = true
    ): State | Store {
        if (!this.isolation || !isolation) {
            return state
        }
        if (state && typeof state === 'object') {
            return JSON.parse(JSON.stringify(state))
        } else return state
    }
}

const DEFAULT_DATA_ERR_MSG =
    '[MediatorX] you should define the fields of store when instantiate MediatorX'
declare type Store = { [fieldName: string]: State }
declare type State =
    | number
    | number[]
    | string
    | string[]
    | PlainObject
    | PlainObject[]
    | boolean
    | boolean[]
    | null
    | null[]

declare interface Subscriber {
    (data: State): void
}

declare interface PlainObject {
    [key: string]: any
}
