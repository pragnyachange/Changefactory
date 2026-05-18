/**
 * @name PQFORCE Task Queue Library
 * @version 1.3.0
 * @file pqfTaskQueueLib.js
 * @description A lightweight persistent function call (=task) manager for synchronous functions.
 *
 * # Features:
 * - Register named functions (via `registerFunction`) that can be captured and replayed later.
 * - Capture function calls with arguments (`captureCall`) and persist them for reliable re-execution.
 * - Replay calls by ID (`replayCall`) with full status tracking.
 * - Retry failed/pending calls (`retryFailedCalls`) with exponential backoff and max retry limits.
 * - List calls by status (`getCallsByStatus`) for monitoring and inspection.
 *
 * # Call Lifecycle:
 *   pending → in_progress → done
 *                 ↘ failed → retried … → permanent_failed
 *
 * # Function Types:
 * - Only synchronous functions are supported.
 * - Return values are stored directly.
 * - Asynchronous functions (Promises, callbacks, I/O) are not supported in this mode.
 *
 * # Typical Use Cases:
 * - Reliable replay of pure, deterministic computations.
 * - Retrying failed function calls where failures are logic-based, not I/O-based.
 * - Tracking and monitoring of synchronous operations across restarts.
 *
 * # Example usage:
 *   function greet(name) { return "Hello, " + name + "!"; }
 *   registerFunction(greet);
 *
 *   let id = captureCall("greet", "Daniel");
 *   let result = replayCall(id); // "Hello, Daniel!"
 *
 *   let failed = getCallsByStatus("failed");
 *   retryFailedCalls();
 * @author DH (INTRASOFT)
 * @pqfId C1F33BFCC36E4926851ADF0FF493F402
 * @created 2025-09-01
 * @modified 2025-12-11
 * @requires e430d37e331848788acbf975d600dd8e (pqfBasicLib.js)
 */

const pqfTaskQueueLib = (function () {

    let _debuggingMode = false;

    const _functionRegistry = {};
    const _INDEX_KEY = "calls:index";
    const _BASE_DELAY_MS = 1000; // 1 second
    const _MAX_RETRIES = 3;
	
    /**
     * Register a named function using its declared name
     */
    function _registerFunction(fn) {
        if (typeof fn !== "function")
            throw new Error("Argument must be a function");
        if (!fn.name)
            throw new Error("Function must have a name");
        _functionRegistry[fn.name] = fn;
		pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, 'function registered: ' + fn.name);
    }

    function _getRegisteredFunctions() {
        return Object.assign({}, _functionRegistry);
    }

	/**
	 * Capture a function call and persist it
	 * @param {string} fnName - The name of the registered function
	 * @param {boolean} repeatable - Can the function be replayed more than once?
	 * @param {...any} args - Optional arguments for the function call
	 */
	function _captureCall(fnName, repeatable) {
        repeatable = (typeof repeatable === "undefined" ? false : repeatable);
		// Validate that the function is registered
		if (!_functionRegistry[fnName]) {
			throw new Error(`Function '${fnName}' is not registered. Please register it first.`);
		}
		
		let args = Array.prototype.slice.call(arguments, 2);
		
		// Store null if no arguments provided, otherwise store the args array
		let hasArgs = args.length > 0;

		let call = {
			id: Pqf.clf.newUuids(1).newUuids[0],
			fnName: fnName,
			args: hasArgs ? args : null, // null indicates no args saved
			status: "pending", // pending | in_progress | waiting_to_repeat | done | failed | permanent_failed
			repeatable: repeatable,
			result: null,
			retries: 0,
			nextRetryAt: Date.now(),
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		store.save(call.id, call);

		let index = store.load(_INDEX_KEY) || [];
		index.push(call.id);
		store.save(_INDEX_KEY, index);

		return call.id;
	}
    /**
     * Replay a call by ID
     * @param {string} callId - The ID of the call to replay
     * @param {Array} runtimeArgs - Optional arguments to use at execution time (only used if no args were saved)
     */
    function _replayCall(callId, runtimeArgs) {
        const call = store.load(callId);
		pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, 'call = ' + JSON.stringify(call));
		
        if (!call)
            throw new Error(`No call found with id: ${callId}`);

        if (call.status === "done")
            return call.result;
        if (call.status === "permanent_failed")
            return call.result;

        const fn = _functionRegistry[call.fnName];
        if (!fn)
            throw new Error(`Unknown function: ${call.fnName}`);

        // Determine which arguments to use
        let argsToUse;
        if (call.args !== null) {
            // Use saved arguments
            argsToUse = call.args;
        } else if (runtimeArgs !== undefined) {
            // Use runtime arguments
            argsToUse = runtimeArgs;
        } else {
            throw new Error(`No arguments available for function ${call.fnName} (neither saved nor provided at runtime)`);
        }
		
		pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, 'argsToUse = ' + JSON.stringify(argsToUse));

        try {
			call.status = "in_progress";
            call.updatedAt = Date.now();
            store.save(call.id, call);

			pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, 'function replaying: ' + call.fnName);
            const result = fn.apply(null, argsToUse);
			pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, 'function replayed: ' + call.fnName);

			if(call.repeatable) {
				call.status = "waiting_to_repeat";
			} else {
				call.status = "done";
			}
            call.result = result;
            call.updatedAt = Date.now();
            store.save(call.id, call);

            return result;
        } catch (err) {
            call.retries = (call.retries || 0) + 1;

            if (call.retries > _MAX_RETRIES) {
                call.status = "permanent_failed";
                call.result = {
                    error: err.message,
                    retries: call.retries
                };
            } else {
                call.status = "failed";
                call.nextRetryAt = Date.now() + Math.pow(2, call.retries) * _BASE_DELAY_MS;
                call.result = {
                    error: err.message,
                    retries: call.retries
                };
            }

            call.updatedAt = Date.now();
            store.save(call.id, call);
            throw err;
        }
    }

    /**
     * Retry failed or pending calls with exponential backoff
     * Automatically removes done/permanent_failed calls from the index
     */
    function _retryFailedCalls() {
        let index = (store.load(_INDEX_KEY)) || [];
        let results = [];
        let keepIds = [];

        for (let i = 0; i < index.length; i++) {
            let callId = index[i];
            let call = store.load(callId);
            if (!call)
                continue;

            let shouldRetry =
                (call.status === "failed" || call.status === "pending") &&
                Date.now() >= (call.nextRetryAt || 0);

            if (shouldRetry) {
                // Check if call has no saved args - if so, we can't auto-retry
                if (call.args === null) {
                    results.push({
                        id: callId,
                        status: "skipped",
                        reason: "No arguments saved - requires manual replay with runtime args"
                    });
                    keepIds.push(callId);
                    continue;
                }

                try {
                    let result = _replayCall(callId);
                    results.push({
                        id: callId,
                        status: "done",
                        result: result
                    });
                } catch (err) {
                    let updated = store.load(callId);
                    if (updated.status === "permanent_failed") {
                        results.push({
                            id: callId,
                            status: "permanent_failed",
                            error: updated.result
                        });
                    } else {
                        results.push({
                            id: callId,
                            status: "failed",
                            error: err.message
                        });
                        keepIds.push(callId);
                    }
                }
            } else if (call.status !== "done" && call.status !== "permanent_failed") {
                keepIds.push(callId);
            }
        }
        store.save(_INDEX_KEY, keepIds);
        return results;
    }

    /**
     * List calls filtered by status
     * @param {string} status - "pending" | "failed" | "done" | "permanent_failed"
     */
    function _getCallsByStatus(status) {
        let index = (store.load(_INDEX_KEY)) || [];
        const calls = [];

        for (let i = 0; i < index.length; i++) {
            let call = store.load(index[i]);
            if (call && call.status === status) {
                calls.push(call);
            }
        }

        return calls;
    }

    return {
        "process": {
            "registerFunction": _registerFunction,
            "captureCall": _captureCall,
            "replayCall": _replayCall,
            "retryFailedCalls": _retryFailedCalls,
        },
        "info": {
            "getCallsByStatus": _getCallsByStatus,
            "getRegisteredFunctions": _getRegisteredFunctions,
        }
    };
})();