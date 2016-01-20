// Stickiness
// dir == 'down' | 'up'
function toggleClassAtScroll (options) {
  var pos       = options.position
    , dir       = options.direction
    , el        = options.element
    , className = options.className
  return function toggleClassAtScroll_inner () {
    var y = window.pageYOffset
    if (dir == 'down' ? y > pos : y < pos) {
      var method = (dir == 'down' ? 'add' : 'remove') + 'Class'
      el[method](className)
      window.removeEventListener('scroll', toggleClassAtScroll_inner)
      options.direction = dir == 'down' ? 'up' : 'down'
      window.addEventListener('scroll', toggleClassAtScroll(options))
    }
  }
}
