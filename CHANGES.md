### 0.8.0-rc.6.dev.1

1. Cate now displays messages in *toasts* - lightweight, ephemeral notices in direct response 
   to a user's action.   
2. The details part of an error message (e.g. Python stack traceback) can now be copied to clipboard.   


### 0.8.0-rc.5

1. Operation step inputs can now be edited an re-executed: 
   In **WORKSPACE** panel, select **Steps**, select a step, and click the **Edit** button.   
2. `matplotlib` figures returned from various `plot` operations can now be displayed with some limited interactions 
   like zooming and panning:
   1. In **OPERATIONS** panel, select a `plot()` operation step, and press **Apply**
   2. In **VIEW** panel, click  **New Figures** view
3. Views can now be positioned. Click a view's **More Menu (...)** and select *Move Before* or *Move After*. 
   Later on, this will be possible via drag and drop.
4. Fixed problem where existence of `~/.cate` was not checked before it was accessed.
5. Fixed problem where a variable's **image layer settings were gone** after selecting another variable.
   Such layer settings are now stored in user preferences store, so that they are available in the next Cate session.

### 0.8.0-rc.4

1. fixed problem where Cate backend couldn't be started (cause: wrong stdio config for node's `child_process.spawn()`)
2. fixed problem where Cate backend couldn't be stopped (cause: the backend was invoked without activated Python env)
