function rndt#build(...) abort
  let l:source = get(a:, 1, v:false)
  return luaeval("require('react-native-devtools.build').build(_A)", l:source)
endfunction
