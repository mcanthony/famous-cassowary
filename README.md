# famous-cassowary [obsolete]

**This project is obsolete and no longer maintained!** Hopefully in the future a full, working integration between Famo.us and Cassowary can be developed. This project never got very far along. For posterity, the original README follows.

- - - -

Auto-layouts with [Famo.us](http://famo.us), via the [Cassowary constraint solver](https://www.cs.washington.edu/research/constraints/solvers/cassowary-tochi.pdf).

A.k.a., an attempt to integrate [cassowary.js](https://github.com/slightlyoff/cassowary.js) and [Famo.us](https://github.com/Famous/famous).

Warning: This repo is currently in the proof-of-concept phase. YMMV.

## Usage

Documentation to come later. For now, please see the [demos](./demos) folder for the most up-to-date examples of what is possible.

## Demos

* **[CassowarySurface](http://matthewtoast.github.io/famous-cassowary/demos/cassowary-surface/):** A stunning demonstration in which you move a colored square around the screen! ([Code](https://github.com/matthewtoast/famous-cassowary/blob/master/demos/cassowary-surface/index.js))

## Development

You'll need Node to install Bower. After you clone the repo:

    npm install -g bower

And then from the project directory, run:

    bower install

This will install the client libraries, namely cassowary.js, famous, famous-polyfills, and requirejs for module loading.

### Loading dependencies

For this to work in the browser, you need to ensure all dependencies are loaded first. Your HTML file will need to have the correct `<meta>` properties set for Famo.us. You'll need to load the Famo.us core stylesheet and polyfills into that HTML file as well. And you'll need to declare a RequireJS config object before loading RequireJS so that it knows where to locate each of the libraries.

A complete example of this can be found in [demos/cassowary-surface](./demos/cassowary-surface).

You may also notice that Gulp is included in the Node modules. This is included for some future possibilities, but not currently used.

## Tests

None currently. Again, this is a proof of concept more than anything. Tests to come when things begin to stabilize.

## Contributing

Please fork and submit pull requests. I'm also happy to grant commit rights to anyone who has made a couple of substantial contributions.

## Author

[Matthew Trost](http://trost.co)

## License

The MIT License (MIT)

Copyright (c) 2014 Matthew Trost

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
