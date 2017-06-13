### 0.8.0-rc.5.dev.0

1. Operation step inputs can now be edited an re-executed: 
   In **WORKSPACE** panel, select **Steps**, select a step, and click the **Edit** button.   
2. `matplotlib` figures returned from various `plot` operations can now be displayed with some limited interactions 
   like zooming and panning:
   1. In **OPERATIONS** panel, select a `plot()` operation step, and press **Apply**
   2. In **VIEW** panel, click  **New Figures** view
3. fixed problem where existence of `~/.cate` was not checked before it was accessed.

### 0.8.0-rc.4

1. fixed problem where Cate backend couldn't be started (cause: wrong stdio config for node's `child_process.spawn()`)
2. fixed problem where Cate backend couldn't be stopped (cause: the backend was invoked without activated Python env)
