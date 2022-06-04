
export const makeTree = (username, estructure ) => {

  let result = [];
  let level = { result };

  estructure.forEach(file => {
    file.path.replace(`/home/streams-for-lab.co/${username}/`,"").split('/').reduce((r, name, i, a) => {
      if(!r[name]) {
        r[name] = {result: []};
        r.result.push({dir: name, file, children: r[name].result})
      }
      
      return r[name];
    }, level)
  }) 

  return {
    dir: "Home",
    children: result
  }
}