require([
  'famous/core/Engine',
  'famous/inputs/MouseSync',
  'famous-cassowary/CassowarySurface'
],function(
  FamousEngine,
  FamousMouseSync,
  CassowarySurface
){

  /* This is a minimal example of the CassowarySurface object.
   *
   * All this does is create a square surface that can be dragged
   * around but which can't be dragged outside of certain bounds.
   *
   * Note that in addition to passing the surface the usual size,
   * content, and properties, we're also sending in three
   * Cassowary-specific properties: variables, expressions, and
   * constraints.
   *
   * - Variables are values that may change over time.
   *
   * - Expressions are linear expressions composed of variables
   *   (referenced by string name), constants (simple numbers),
   *   and operators (supplied as strings). Note that Cassowary
   *   can *only* handle linear expressions; exponents and non-
   *   linear expressions will raise an exception.
   *
   * - Constraints are the rules that the system should ensure
   *   are kept in place as variables change. The format is:
   *   [reference, comparator, reference/value, strength, weight]
   *   E.g. ['width', '>=', 'height', 'strong', 1]
   *
  */

  var context = FamousEngine.createContext();

  /* Important note!:
   *
   * Famo.us provides a 'Draggable' modifier that you can use to
   * add draggability to Surfaces. You wouldn't want to implement
   * a dragging system using anything like the code below. The
   * following is provided purely to illustrate how to build a
   * CassowarySurface with this library, and the dragging interface
   * is only meant as a proof of concept.
  */

  // We'll track the mouse position to decide where to place the surface.
  var mouseDragPosition = [100, 100]; // Drag's actual position
  var mouseDragPositionOffset = [100, 100]; // Anchor position within the surface
  var mouseDragStartedInsideSurface = false;

  // Prepare the handler for piped-in mouse drag events.
  var mouseSync = new FamousMouseSync();
  FamousEngine.pipe(mouseSync);

  // When the drag begins, make note of the starting position, and whether
  // or not the drag began within the bounds of the surface we're tracking.
  mouseSync.on('start', function(data) {
    var surfaceVariables = cassowarySurface.variables;

    var width = surfaceVariables.width.value;
    var height = surfaceVariables.height.value;
    var left = surfaceVariables.left.value;
    var top = surfaceVariables.top.value;

    var right = left + width;
    var bottom = top + height;

    var mouseX = data.clientX;
    var mouseY = data.clientY;

    if (mouseX >= left &&
        mouseX <= right &&
        mouseY >= top &&
        mouseY <= bottom) {

      mouseDragStartedInsideSurface = true;
      mouseDragPosition[0] = data.clientX;
      mouseDragPosition[1] = data.clientY;
      mouseDragPositionOffset[0] = mouseDragPosition[0] - left;
      mouseDragPositionOffset[1] = mouseDragPosition[1] - top;

    } else {
      mouseDragStartedInsideSurface = false;
    }
  });

  // If the drag started within the surface, update the drag position.
  mouseSync.on('update', function(data) {
    if (mouseDragStartedInsideSurface) {
      mouseDragPosition[0] = data.clientX;
      mouseDragPosition[1] = data.clientY;
    }
  });

  // Reset the mouse targeting flag when the drag is finished.
  mouseSync.on('end', function(data) {
    mouseDragStartedInsideSurface = false;
  });

  // A surface bound by constraints computed by the Cassowary solver.
  var cassowarySurface = new CassowarySurface({
    size: [200, 200],
    content:
      '<p>The cassowaries are flightless birds in the genus Casuarius.</p>' +
      '<p>[ Click & drag me ]</p>' +
      '<p><a href="https://github.com/matthewtoast/famous-cassowary/">Source code on GitHub &#8608;</a></p>',
    properties: {
      backgroundColor: 'rgba(255,100,100,1.0);',
      color: '#ddddff',
      cursor: 'move',
      fontFamily: 'Helvetica, Arial, sans-serif',
      textAlign: 'center',
      padding: '10px 20px'
    },
    // Variables assign values to the surface's CSS-style properties.
    // They can be constant, or changing over time if supplied as functions.
    // They can be referenced by property name among the expressions and constraints.
    variables: {
      width: 200,
      height: 200,
      left: function() {
        return mouseDragPosition[0] - mouseDragPositionOffset[0];
      },
      top: function() {
        return mouseDragPosition[1] - mouseDragPositionOffset[1];
      },
      backgroundColor: function() {
        return mouseDragPosition[0] / 2;
      }
    },
    // Since CSS-style values come in a variety of formats (px, em, hex colors...),
    // a formatters API is provided. The computed value of each variable or expression
    // is passed through the formatter before assigned to the surface's properties.
    formatters: {
      width: pxFormatter,
      height: pxFormatter,
      left: pxFormatter,
      top: pxFormatter,
      backgroundColor: colorFormatter
    },
    // Expressions are linear expressions that are also evaluated by the solver.
    // They can be referenced by name (like variables) among the constraints.
    expressions: {
      right:  ['left', '+', 'width', '-', 125],
      bottom: ['top',  '+', 'height'],
    },
    // Constraints is a list of constraints that the solver should adhere to
    // when computing the solution. The final element in each array is the strength.
    // Constraints can reference named variables or expressions defined above.
    constraints: [
      ['width',  '>=', 200, 'required'],
      ['height', '>=', 200, 'required'],
      ['left',   '>=', 20,  'required'],
      ['top',    '>=', 20,  'required'],
      ['right',  '<=', 400, 'required'],
      ['bottom', '<=', 400, 'required'],
      ['backgroundColor', '<=', 255, 'required']
    ]
  });

  function pxFormatter(value) {
    return value + 'px';
  }

  function colorFormatter(value) {
    return 'rgba(' + ~~value + ', 100, 100, 1.0)';
  }

  context.add(cassowarySurface);

});
