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

  // Important note!:
  //
  // Famo.us provides a 'Draggable' modifier that you can use to
  // add draggability to Surfaces. You wouldn't want to implement
  // a dragging system using anything like the code below. The
  // following is provided purely to illustrate how to build a
  // CassowarySurface with this library and the dragging interface
  // is only meant as a proof of concept.

  var mousePosition = [100, 100];
  var mousePositionOffset = [100, 100];
  var mouseSync = new FamousMouseSync();
  FamousEngine.pipe(mouseSync);
  var dragStartedInsideSurface = false;
  mouseSync.on('start', function(data) {
    var surfaceVariables = getSurfaceVariables();
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
      dragStartedInsideSurface = true;
      mousePosition[0] = data.clientX;
      mousePosition[1] = data.clientY;
      mousePositionOffset[0] = mousePosition[0] - left;
      mousePositionOffset[1] = mousePosition[1] - top;
    } else {
      dragStartedInsideSurface = false;
    }
  });
  mouseSync.on('update', function(data) {
    if (dragStartedInsideSurface) {
      mousePosition[0] = data.clientX;
      mousePosition[1] = data.clientY;
    }
  });
  mouseSync.on('end', function(data) {
    dragStartedInsideSurface = false;
  });

  var cassowarySurface = new CassowarySurface({
    size: [200, 200],
    content:
      '<p>The cassowaries are flightless birds in the genus Casuarius.</p>' +
      '<p>[ Click & drag me ]</p>' +
      '<p><a href="https://github.com/matthewtoast/famous-cassowary/">Source code on GitHub &#8608;</a></p>',
    properties: {
      backgroundColor: '#339933',
      color: '#ddddff',
      fontFamily: 'Helvetica, Arial, sans-serif',
      textAlign: 'center',
      padding: '10px 20px'
    },
    variables: {
      width: 200,
      height: 200,
      left: function() {
        return mousePosition[0] - mousePositionOffset[0];
      },
      top: function() {
        return mousePosition[1] - mousePositionOffset[1];
      }
    },
    expressions: {
      right:  ['left', '+', 'width', '-', 125],
      bottom: ['top',  '+', 'height'],
    },
    constraints: [
      ['width',  '>=', 200, 'required'],
      ['height', '>=', 200, 'required'],
      ['left',   '>=', 20,  'required'],
      ['top',    '>=', 20,  'required'],
      ['right',  '<=', 400, 'required'],
      ['bottom', '<=', 400, 'required']
    ]
  });

  function getSurfaceVariables() {
    return cassowarySurface.variables;
  }

  context.add(cassowarySurface);

});
