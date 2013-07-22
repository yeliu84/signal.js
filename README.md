# Signals/Slots in JavaScript

SignalJS is a minimalist implementation of [signals/slots system][1] in JavaScript.

[1]: http://en.wikipedia.org/wiki/Signals_and_slots "Wikipedia Entry"

## How to Use

Say I have an app called MyApp, it has two objects MyApp.X and MyApp.Y. MyApp.Y
wants to be notified if there are some events happened on MyApp.X. I just need
the following few steps to accomplish the task:

1. Clone this repo and add `signal.js` to my HTML

    ```html
    <script src="path/to/signal.js"></script>
    ```

2. Create a signal and attach it to `MyApp` namespace, so it can be accessed by
   both MyApp.X and MyApp.Y

    ```javascript
    MyApp.dummySignal = Signal.create('dummySignal');
    ```

3. Connect to the just created signal in MyApp.Y

    ```javascript
    MyApp.Y.signalHandler = function(sender, data) {
        console.log('Received a dummySignal from sender with data');
    };

    MyApp.dummySignal.connect(MyApp.Y.signalHandler, MyApp.Y);
    ```

4. Emit the signal when some event is happened on MyApp.X

    ```javascript
    MyApp.X.http.get('/data').
        success(function(response) {
            /*
             * Got new data, send signal to notify whomever is connected. In
             * this example, `MyApp.Y.signalHandler` will be called.
             */
            MyApp.dummySignal.emit(MyApp.X, response);
        });
    ```

5. That's it!

[Live DEMO](http://plnkr.co/edit/pGs57j)

## How to Run Tests
TODO
