

//  Promise -> JWPromise
// ● new Promise(executor)
// ● Promise.all(iterable) (supposed that iterable is the type of Array<Promise>)
// ● Promise.resolve(reason)
// ● Promise.reject(value)
// ● Promise.prototype.then(func)
// ● Promise.prototype.catch(func)
// ● Promise.prototype.finally(func)

// ● new JWPromise(executor)
class JWPromise {
    constructor (executor){
        this.status = 'pending';
        this.result = undefined;
        this.taskList = {
            fulfill : new Array(),
            reject: new Array()
        };
        typeof executor ==='function'
        ? executor(JWPromise.resolve.bind(this),JWPromise.reject.bind(this))
        :null;
    }
    // ● Promise.all(iterable) (supposed that iterable is the type of Array<Promise>)    
    static all = (iterable) => {
        return new JWPromise((resolve,reject) => {
            const result = iterable.map(()=>({
                status:'pending',
                result:undefined
            }))
            iterable.forEach((eachVal,index) => {
                if(eachVal instanceof JWPromise === false){
                    result[index] = {status:'fulfilled',result:eachVal};
                    const isDone = !result.some(v => v.status === 'pending');
                    if(isDone) resolve(result.map(v=>v.result))
                }else{
                    eachVal.then(value => {
                        result[index] = {status:'fulfilled', result:value};
                        const isDone = !result.some(v => v.status === 'pending');
                        if(isDone) resolve(result.map(v=>v.result))
                    }).catch(error => reject(error))
                }
            });
        })
    }
    // ● Promise.resolve(reason)
    static resolve = function(reason) {
        let returnPromise = this instanceof JWPromise?this:new this;
        if(returnPromise.status==='pending'){
            returnPromise.status = 'fulfilled';
            returnPromise.result = reason;
            returnPromise.#clearTasks(returnPromise.taskList.fulfill);
        } return returnPromise;
    }
    // ● Promise.reject(value)
    static reject = function(value) {
        let returnPromise = this instanceof JWPromise?this:new this;
        if(returnPromise.status==='pending'){
            returnPromise.status = 'rejected';
            returnPromise.result = value;
            returnPromise.#clearTasks(returnPromise.taskList.reject);
        } return returnPromise;
    }
    // ● Promise.prototype.then(func)
    then = (onFulfilled,onRejected) => {
        const fTask = () => {
            if(typeof onFulfilled === 'function'){
                const callback = onFulfilled(this.result);
                JWPromise.resolve(callback);
            }else JWPromise.resolve(this.result);
        }
        const rTask = () => {
            if(typeof onRejected === 'function'){
                const callback = onRejected(this.result);
                JWPromise.reject(callback);
            }else JWPromise.reject(this.result);
        }
        if(this.status ==='pending'){
            this.taskList.fulfill = [...this.taskList.fulfill,fTask];
            this.taskList.reject = [...this.taskList.reject,rTask];
        }else if(this.status ==='fulfilled') this.#addQueue(fTask);
        else this.#addQueue(rTask);
        return this;
    }
    // ● Promise.prototype.catch(func)
    catch = (func) => {
        return this.then(null,func);
    }
    // ● Promise.prototype.finally(func)
    finally = (func) => {
        this.then(()=>this.then(func))
        .catch(()=>{this.catch(func)})
        return this;
    }
    // 대기 task EventLoop보내고 taskList비우기
    #clearTasks = (tasks) => {
        tasks.map(this.#addQueue);
        this.taskList.fulfill = [];
        this.taskList.reject = [];
    }
    // EventLoop 실행기
    #addQueue = (task) => {
        setTimeout(task,0);
    }
}