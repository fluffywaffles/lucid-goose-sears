// NOTE(jordan): based on Paul Irish's bling dot js gist

var $ = document.querySelectorAll.bind(document)
var $1 = document.querySelector.bind(document)

Node.prototype.addClass = function (c) {
  return this.classList.add(c)
}

Node.prototype.removeClass = function (c) {
  return this.classList.remove(c)
}

Node.prototype.toggleClass = function (c, onoff) {
  return this.classList.toggle(c, onoff)
}

Node.prototype.on = function (name, fn) {
  this.addEventListener(name, fn)
}

// NOTE(jordan): get forEach
NodeList.prototype.__proto__ = Array.prototype

NodeList.prototype.on = NodeList.prototype.addEventListener = function (name, fn) {
  this.forEach(function (elem, i) {
    elem.on(name, fn)
  })
}
