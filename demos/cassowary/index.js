require([
  'cassowary-system/Cassowary'
],function(
  Cassowary
){

  /* This is just an example of a simple Cassowary invocation
   * using the cassowary.js library directly.
  */

  var solver = new Cassowary.SimplexSolver();

  var gte = Cassowary.GEQ;
  var lte = Cassowary.LEQ;

  var low = Cassowary.Strength.weak;
  var med = Cassowary.Strength.medium;
  var high = Cassowary.Strength.strong;
  var req = Cassowary.Strength.required;

  var v1 = new Cassowary.Variable({ value: 0 });
  var v2 = new Cassowary.Variable({ value: 200 });

  var e1 = Cassowary.Expression.fromVariable(v1);
  var e2 = Cassowary.Expression.fromVariable(v2);

  var constraints = [
    new Cassowary.Inequality(v1, gte, 0,   req),
    new Cassowary.Inequality(v2, gte, 0,   req),
    new Cassowary.Inequality(e1.plus(e2), lte, 400, req)
  ];

  console.log("Constraint: v1 should be > 0");
  console.log("Constraint: v2 should be > 0");
  console.log("Constraint: v1 + v2 should not exceed 400");

  solver.addEditVar(v1);
  solver.addEditVar(v2);

  solver.add.apply(solver, constraints);

  console.log(
    "Initial values:",
    v1.value,
    v2.value
  );

  solver.suggestValue(v1, 50);
  solver.suggestValue(v2, 50);
  solver.resolve();

  console.log(
    "An acceptable suggestion (50, 50) yields",
    v1.value,
    v2.value
  );

  solver.suggestValue(v1, 300);
  solver.suggestValue(v2, 101);
  solver.resolve();

  console.log(
    "An out-of-bounds suggestion (300, 101) yields",
    v1.value,
    v2.value
  );

});
