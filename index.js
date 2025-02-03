
/*
    description: command line categorical note tree
    Author: Alexander Eatman
*/

const fs = require('node:fs')
const path = require('path')

/*
    helper 
*/

function readFromFileTreeData() { 
    let d = fs.readFileSync(__dirname + '/treeData.json', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        return data;
    });

    return JSON.parse(d);

}

/*
    read-write files

    @param treeDataRef 
    -avoids reading treedata more than once in each function
    -used in all command functions and not in tree functions

*/

let treeDataRef
let hashKey

function readFromFile(fileName) { 
    let path

    if(fileName === 'treeData.json') { 
        path = __dirname + '/treeData.json'

    } else { 
        if(!treeDataRef) { 
            treeDataRef = readFromFileTreeData()
            hashKey = treeDataRef.treeHash
            if(treeDataRef.selectedTree === '') { 
                console.log('please select a tree cttreeSelect <folder-name>')
                return false
            }
        }

        path = `${__dirname}/trees/${treeDataRef.selectedTree}/${fileName}` 

    }

    let d = fs.readFileSync(path, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return false;
        }
        return d;
    });

    return JSON.parse(d)
    
}

function writeToFile(fileName, data) { 
    let path;

    if(fileName === 'treeData.json') { 
        path = __dirname + '/treeData.json'
    } else { 
        path = `${__dirname}/trees/${treeDataRef.selectedTree}/${fileName}`
    }

    fs.writeFileSync(path, JSON.stringify(data, null, 4), (err, data) => {
        if (err) {
            console.error(err);
            return false
        }
    });

}

/*
    state change function treeData.json
    could use try catch but there are other values in treeData.json
*/

function stateChange(args) {
    let param = args[0]
    let stateChangeList = ['showInsideCategories', 'moveRoot', 'moveNodeIntoSamePath', 'canDeleteTree']
    if(!stateChangeList.includes(param)) { 
        console.log('the parameter to be changed does not exist')
        return
    }
    let treeData = readFromFile('treeData.json')
    if(treeData[param]) { 
        treeData[param] = false
        console.log(param + '=false')
    } else { 
        treeData[param] = true
        console.log(param + '=true')
    }
    writeToFile('treeData.json', treeData)
}

/*
    gets the object requested in the tree
    maybe best option would be to save as a string then use eval
*/

function referenceObject(current, refIndex, editReference) {  
    try { 
        function recurse(curr, refID) {
            if(refID === editReference.length) { 
                return curr;
            }
            return recurse(curr[editReference[refID]], refID+=1)
        }
        return recurse(current, refIndex)
    } catch(err) { 
        return false
    } 
}

/*
    lists the contents of the tree at the first or second level
*/

function listTreeNode(ref, editReference) { 
    console.log('tree: ' + treeDataRef.selectedTree)
    console.log('path: main->' + editReference.join('->')) 
    console.log('description: ' + ref[hashKey].description);
    console.log('----------')
    for(const [category, obj] of Object.entries(ref)) {
        if(category !== hashKey) {
            console.log(`${category}: ${obj[hashKey].description}`)
            if(treeDataRef.showInsideCategories) {
                for(const [categoryB, objB] of Object.entries(ref[category])) {
                    if(categoryB !== hashKey) { 
                        console.log('   ' + categoryB + ': ' + objB[hashKey].description)
                    }
                }
            }
        }
    }
}

/*
    shows what place the user is in the tree using @param editReference
*/

function showPlace() { 
    let data = readFromFile('data.json')
    if(!data) {
        return
    }
    console.log('main->' + data.editReference.join('->'))
}

/*
    resets the current node root and is read
*/

function refresh() { 
    let data = readFromFile('data.json')
    if(!data) { 
        return
    }
    data.editReference = []
    listTreeNode(readFromFile('categoricalNoteTree.json'), data.editReference)
    writeToFile('data.json', data)
}   

/*
    reads the tree at the current node
*/

function list() { 
    let data = readFromFile('data.json')
    if(!data) { 
        return
    }
    let node = referenceObject(readFromFile('categoricalNoteTree.json'), 0, data.editReference)
    if(!node) {
        console.log('category not found')
        return
    }
    listTreeNode(node, data.editReference)
}

/*
    adds a node to the tree at the current node/path
*/

function add(args) { 
    let data = readFromFile('data.json')
    if(!data) {
        return
    }

    let categoricalNoteTree = readFromFile('categoricalNoteTree.json')
    let editReference = data.editReference;
    let title = args[0]
    let description = args[1]

    if(typeof(title) === 'undefined' || title === hashKey ) { 
        console.log(`please enter a category that is not the word (${hashKey})`)
        return
    }

    if(typeof(description) === 'undefined') { 
        console.log('please enter in a description')
        return
    }

    let current = referenceObject(categoricalNoteTree, 0, editReference)

    if(!current) { 
        console.log('object to add into not found')
        return
    }

    if(typeof(current[title]) !== 'undefined') { 
        console.log('the category has already been added')
        return
    }

    let copyPrevTree = JSON.parse(JSON.stringify(categoricalNoteTree))   

    current[title] =  { 
        [hashKey]: { 
            description: description
        }
    } 

    listTreeNode(current, editReference)
    writeToFile('categoricalNoteTree.json', categoricalNoteTree)
    let prevTree = readFromFile('history.json')
    prevTree.trash.unshift({tree: copyPrevTree, time: new Date()})
    writeToFile('history.json', prevTree)

}

/*
    removes the current node
    @param removal : key neccessary for removal
*/

function remove() {
    let data = readFromFile('data.json')
    if(!data) { 
        return
    }

    if(data.editReference.length === 0) {
        console.log('Must call a specific function <ctremoveTree> to remove the tree in trees folder')
        return
    }

    let removal = data.editReference[data.editReference.length - 1]
    data.editReference.pop()
    let categoricalNoteTree = readFromFile('categoricalNoteTree.json')
    let current = referenceObject(categoricalNoteTree, 0, data.editReference)

    if(!current || removal && typeof(current[removal]) === 'undefined') { 
        console.log('the remove-from path does not exist')
        return
    }

    let copyPrevTree = JSON.parse(JSON.stringify(categoricalNoteTree, null, 4))

    delete current[removal]
    listTreeNode(current, data.editReference)
    let prevTree = readFromFile('history.json')
    prevTree.trash.push({ tree: copyPrevTree, time: new Date() })
    writeToFile('history.json', prevTree) 
    writeToFile('categoricalNoteTree.json', categoricalNoteTree)
    writeToFile('data.json', data)

}

/*
    edits the current nodes description
*/

function edit(args) {
    if(typeof(args[0]) !== 'string') {
        console.log('input must be a string')
        return
    }

    let description = args[0]

    let data = readFromFile('data.json')
    if(!data) { 
        return
    }

    if(data.editReference.length === 0) { 
        console.log('the description can only be changed if the category is not the root node')
        return
    }

    let categoricalNoteTree = readFromFile('categoricalNoteTree.json')
    let current = referenceObject(categoricalNoteTree, 0, data.editReference)
    if(!current) { 
        console.log('category does not exist')
        return
    }

    let copyPrevTree = JSON.parse(JSON.stringify(categoricalNoteTree, null, 4))

    current[hashKey].description = description

    listTreeNode(current, data.editReference)
    writeToFile('categoricalNoteTree', categoricalNoteTree)
    let prevTree = readFromFile('history.json')
    prevTree.trash.unshift({tree: copyPrevTree, time: new Date()})
    writeToFile('history.json', prevTree)

}

/*

    moves current node

    @param current : one behind the object to be moved : mandatory key (categoryKey) so that the object can be identified and functionally removed
    @param copyIntoPath : the object to copy into
    @param movebackdelete : if the copy-into-path is inside the object to be moved, must move back key
    @param categoryKey is used for a few different things like removing, and determining if in root 

    if(
        path.length > data.editReference.length && 
        data.editReference.join() === path.slice(0, data.editReference.length).join()
    ) { 
        moveBackBeforeDelete = true
    }

*/

function moveTrunk(path) {
    if(typeof(path) === 'undefined' || !Array.isArray(path)) { 
        console.log('the path must be 0 or more words')
        return
    }

    let categoricalNoteTree = readFromFile('categoricalNoteTree.json')
    if(!categoricalNoteTree) {
        return
    }

    let data = readFromFile('data.json')

    if(path.join() === data.editReference.join()) { 
        console.log('attempting to move category into the same path')
        return
    }

    if(data.editReference.length === 0 && !treeDataRef.moveRoot) {
        console.log('moving the root data structure is disabled <cthelp>')
        return
    }

    let moveBackBeforeDelete = false
    if(path.length > data.editReference.length) { 
        moveBackBeforeDelete = true
        for(let i = 0; i < data.editReference.length; i++) {
            if(data.editReference[i] !== path[i]) { 
                moveBackBeforeDelete = false
                break
            }
        } 
    }

    if(moveBackBeforeDelete && !treeDataRef.moveNodeIntoSamePath) { 
        console.log('moving the current node deeper into the same path is disabled <cthelp>')
        return
    }

    let categoryKey = data.editReference[data.editReference.length - 1] 
    data.editReference.pop() 
    let current = referenceObject(categoricalNoteTree, 0, data.editReference)
    if(!current || categoryKey && typeof(current[categoryKey]) === 'undefined') { 
        console.log('the move-from path does not exist')
        return
    }

    let copyIntoPath = referenceObject(categoricalNoteTree, 0, path)

    if(typeof(copyIntoPath) === 'undefined') { 
        console.log('the copy-into path does not exist')
        return
    }

    if(categoryKey && typeof(copyIntoPath[categoryKey]) !== 'undefined' || !categoryKey && typeof(copyIntoPath['root']) !== 'undefined') { 
        console.log('an object with that category already exists at that location')
        return
    }

    /*
        1. make copy of moving-object
        2. place copy into the copy-into-path
        3. delete the moving-object - might delete the copy-into path... thats why a copy is made
        4. if copying deeper into the same path including copying the root, must bring the copy-into-path object back
        5. note - maybe merge copy-into-path with movingObjectCopy if moving the root
    */

    let movingObjectCopy = JSON.parse(JSON.stringify(categoryKey ? current[categoryKey] : current)) 

    let copyPrevTree = JSON.parse(JSON.stringify(categoricalNoteTree))

    copyIntoPath[categoryKey ? categoryKey : 'root'] = movingObjectCopy
    let copy = moveBackBeforeDelete ? JSON.parse(JSON.stringify(copyIntoPath)) : null 

    if(categoryKey) { 
        delete current[categoryKey] 
    } else { 
        current = {} 
        categoricalNoteTree = current

        current[hashKey] = { 
            description: treeDataRef.selectedTree 
        }
        
    }

    if(moveBackBeforeDelete) { 
        let pathKey = path[path.length - 1]
        if(typeof(current[pathKey]) !== 'undefined') { 
            console.log('an object with that category already exists at that location')
            return
        }

        console.log('additional copies were made because of copying into the same object')
        current[pathKey] = copy

    } 

    listTreeNode(current, data.editReference)
    writeToFile('categoricalNoteTree.json', categoricalNoteTree)
    writeToFile('data.json', data)
    let prevTree = readFromFile('history.json')
    prevTree.trash.unshift({tree: copyPrevTree, time: new Date()})
    writeToFile('history.json', prevTree)
    
}

/*
   historical viewing functions
*/

function revert() {     
    let data = readFromFile('data.json')
    if(!data) {
        return
    }

    let historicalObject = readFromFile('history.json')

    if(typeof(historicalObject.trash[data.treeHistoryIndex]) === 'undefined') { 
        console.log('could not find a historical tree node')
        return
    }

    data.editReference = []
    listTreeNode(historicalObject.trash[data.treeHistoryIndex].tree, data.editReference)
    writeToFile('categoricalNoteTree.json', historicalObject.trash[data.treeHistoryIndex].tree)
    writeToFile('data.json', data)

}

function moveForwardInHistory() {
    let data = readFromFile('data.json')
    if(!data) { 
        return
    }

    let historicalObject = readFromFile('history.json')

    if(typeof(historicalObject.trash[data.treeHistoryIndex + 1]) === 'undefined') { 
        console.log('reached the end of the list')
        return
    }

    data.treeHistoryIndex += 1

    console.log('historical tree number: ' + data.treeHistoryIndex) 
    console.log('time inserted: ' + historicalObject.trash[data.treeHistoryIndex].time)
    console.log(historicalObject.trash[data.treeHistoryIndex].tree)

    writeToFile('data.json', data)

}

function moveBackwardInHistory() { 
    let data = readFromFile('data.json')
    if(!data) { 
        return
    }

    let historicalObject = readFromFile('history.json')

    if(typeof(historicalObject.trash[data.treeHistoryIndex - 1]) === 'undefined') { 
        console.log('reached the beginning of the list')
        return
    }

    data.treeHistoryIndex -= 1

    console.log('historical tree number: ' + data.treeHistoryIndex) 
    console.log('time inserted: ' + historicalObject.trash[data.treeHistoryIndex].time)
    console.log(historicalObject.trash[data.treeHistoryIndex].tree)

    writeToFile('data.json', data)

}

function resetHistoricalIndex() { 
    let data = readFromFile('data.json')
    if(!data) { 
        return
    }

    let historicalObject = readFromFile('history.json')
    data.treeHistoryIndex = 0
    writeToFile('data.json', data)

    if(typeof(historicalObject.trash[data.treeHistoryIndex]) === 'undefined') { 
        console.log('a historical object has not been inserted into the tree')
        return
    }

    console.log('historical tree number: ' + data.treeHistoryIndex) 
    console.log('time inserted: ' + historicalObject.trash[data.treeHistoryIndex].time)
    console.log(historicalObject.trash[data.treeHistoryIndex].tree)

}

/*
    returns all paths which contain the input search string
*/

function find(args) {
    if(typeof(args[0]) === 'undefined') { 
        console.log('please enter a description you are looking for')
        return
    }

    let categoricalNoteTree = readFromFile('categoricalNoteTree.json')
    if(!categoricalNoteTree) { 
        return
    }

    let searchString = args[0]
    let keyPath = []
    let savedKeyPaths = ''

    function traverse(current) { 
        for(const [key, value] of Object.entries(current)) { 
            if(key !== hashKey) {
                keyPath.push(key)
                traverse(current[key])
                if(value[hashKey].description.toLowerCase().includes(searchString.toLowerCase())) { 
                    savedKeyPaths += keyPath.join('->') + '\n'
                }
                keyPath.pop()
            }
        }
    }

    traverse(categoricalNoteTree)
    console.log(savedKeyPaths)

}

/*
    rename the current nodes key-category
    @param copy - probably unneccessary
*/

function renameCategory(args) {
    if(typeof(args[0]) === 'undefined') { 
        console.log('please rename the category key')
        return
    }

    let inputKey = args[0]
    let categoricalNoteTree = readFromFile('categoricalNoteTree.json')
    if(!categoricalNoteTree) { 
        return
    }

    if(inputKey === hashKey) { 
        console.log('cannot rename the dedicated hash key')
        return
    }

    let data = readFromFile('data.json')
    if(data.editReference.length === 0) { 
        console.log('can not change the root key of the object <cthelp>')
        return
    }

    let categoryKey = data.editReference[data.editReference.length - 1]
    data.editReference.pop()
    let current = referenceObject(categoricalNoteTree, 0, data.editReference)
    if(!current || typeof(current[categoryKey]) === 'undefined') {
        console.log('could not find the current node')
        return
    }

    if(typeof(current[inputKey]) !== 'undefined') { 
        console.log('that  key-category already exists')
        return
    }

    let copy = JSON.parse(JSON.stringify(current[categoryKey])) 
    let copyPrevTree = JSON.parse(JSON.stringify(categoricalNoteTree))
    current[inputKey] = copy 
    delete current[categoryKey] 

    listTreeNode(current, data.editReference)
    writeToFile('categoricalNoteTree.json', categoricalNoteTree)
    writeToFile('data.json', data)
    let prevTree = readFromFile('history.json')
    prevTree.trash.unshift({tree: copyPrevTree, time: new Date()})
    writeToFile('history.json', prevTree)

}

/*
    df moves forward or backward at the current node
    goto goes to a specific path
*/

function directionalFunction(title, popOrpush) { 
    let data = readFromFile('data.json')
    if(!data) { 
        return
    }

    if(title === hashKey) { 
        console.log('attempting to enter into a hash')
        return
    }

    let categoricalNoteTree = readFromFile('categoricalNoteTree.json')
    let editReference = data.editReference

    if(popOrpush === 'push') {
        editReference.push(title)
    } else { 
        editReference.pop()
    }

    let current = referenceObject(categoricalNoteTree, 0, editReference)
    if(!current) {
        console.log('That node does not exist')
        return;
    }

    listTreeNode(current, editReference)
    writeToFile('data.json', data)

}

function forward(args) {
    if(typeof(args[0]) === 'undefined') { 
        console.log('a category must be passed in to move forward in the tree')
        return
    }
    directionalFunction(args[0], 'push')
}

function backward() { 
    directionalFunction(null, 'pop')
}

function goto(path) { 
    if(typeof(path) === 'undefined' || !Array.isArray(path)) { 
        console.log('the path must be 0 or more words')
        return
    }

    let categoricalNoteTree = readFromFile('categoricalNoteTree.json')
    if(!categoricalNoteTree) { 
        return
    }

    if(path.includes(hashKey)) { 
        console.log('attempting to enter into a hashed key')
        return
    }

    let node = referenceObject(categoricalNoteTree, 0, path)
    if(!node) {
        console.log('path does not exist')
        return
    }

    listTreeNode(node, path)
    let data = readFromFile('data.json')
    data.editReference = path
    writeToFile('data.json', data)

}

/*
    tree functions
*/

function addTree(args) {
    if(typeof(args[0]) === 'undefined') {
        console.log('please enter in a tree name')
        return
    }

    let treeName = args[0]
    let folder = fs.readdirSync(__dirname + '/trees')

    for(let i = 0; i < folder.length; i++) { 
        let fileType = path.join(__dirname + '/trees', folder[i])
        if(fs.statSync(fileType).isDirectory()) { 
            if(folder[i] === treeName) { 
                console.log('that tree name already exists')
                return
            }
        }   
    }

    let data = JSON.stringify({
        editReference: [],
        treeHistoryIndex: 0
    }, null, 4)

    let history = JSON.stringify({ 
        trash: []
    }, null, 4)

    let hashKey = readFromFile('treeData.json').treeHash

    if(!hashKey) {
        console.log('a hashKey needs to be defined to creata a tree')
        console.log('all nodes must have the same hash key')
        return
    } 

    let categoricalNoteTree = JSON.stringify({
        [hashKey]: { 
            description: treeName
        }
    }, null, 4)

    let newFolder = `${__dirname}/trees/${treeName}`

    try { 
        fs.mkdirSync(newFolder)
        fs.writeFileSync(path.join(newFolder, 'data.json'), data)
        fs.writeFileSync(path.join(newFolder, 'history.json'), history)
        fs.writeFileSync(path.join(newFolder, 'categoricalNoteTree.json'), categoricalNoteTree)
    } catch(err) { 
        console.log('error: ' + err)
        try { fs.rmdirSync(newFolder) } catch(err) {} 
        return
    }

    console.log('a new tree has been created')
    console.log('<cttreeList> to see all trees and the selected tree')
    console.log('<cttreeSelect> to select a tree')
    
}

function listTrees() { 
    let folder = fs.readdirSync(__dirname + '/trees')
    let treeData = readFromFile('treeData.json')
    console.log(`selected tree: ${treeData.selectedTree ? treeData.selectedTree : '(no tree selected)'}`)
    console.log('--------')
    console.log('all trees\n--------')
    for(let i = 0; i < folder.length; i++) { 
        let fileType = path.join(__dirname + '/trees', folder[i])
        if(fs.statSync(fileType).isDirectory()) { 
            console.log(folder[i])
        }   
    }
}

function selectTree(args) { 
    if(typeof(args[0]) === 'undefined') { 
        console.log('please pass in a tree name to select')
        return
    }

    let treeFolder = args[0]
    let folder = fs.readdirSync(__dirname + '/trees')
    let treeData = readFromFile('treeData.json')
    for(let i = 0; i < folder.length; i++) { 
        let fileType = path.join(__dirname + '/trees', folder[i])
        if(fs.statSync(fileType).isDirectory()) { 
            if(treeFolder === folder[i]) { 
                treeData.selectedTree = folder[i]
                writeToFile('treeData.json', treeData) 
                console.log('a new tree has been selected. type ctroot to see its root')
                return
            }
        }   
    }

    console.log('tree not found')

}

function deleteTree() { 
    let treeData = readFromFile('treeData.json')
    if(!treeData.canDeleteTree) {
        console.log('must set canDelete to true (ctstateChange canDeleteTree)')
        return
    }

    if(treeData.selectedTree === '') {
        console.log('you are not in a tree to delete')
        return
    }

    let folder = fs.readdirSync(__dirname + '/trees')
    for(let i = 0; i < folder.length; i++) { 
        let fileType = path.join(__dirname + '/trees', folder[i])
        if(fs.statSync(fileType).isDirectory()) { 
            if(treeData.selectedTree === folder[i]) { 
                try { 
                    fs.rmSync(__dirname + '/trees/' + folder[i], { recursive: true, force: true }) 
                } catch(err) {
                    console.log('error deleting folder' + err)
                    return
                } 
                console.log('successfully deleted tree')
                treeData.selectedTree = ''
                writeToFile('treeData.json', treeData) 
                break
            }
        }   
    }

}

/*
    command help - change to one log
*/

function help() { 
    console.log('cthelp : shows all commands \n') 
    console.log('ctroot : resets the current node to the root\n')
    console.log('ctlist : lists the current nodes categories and their description')
    console.log('ctadd <category> <description> : adds a category to the current node with a description')
    console.log('ctdelete : deletes the current node') 
    console.log('ctedit <description> : edits the current nodes description')
    console.log('ctfor <category> : moves forward into the selected category')
    console.log('ctback : moves backward from the current node')
    console.log('ctcurr : shows the current path')
    console.log('ctstateChange <variable> : disables and enables data variables in treeData.json')
    console.log('ctmove <path> : moves the current node to the selected path')
    console.log('ctfind <description> : finds all nodes which contain the input description') 
    console.log('ctrename <name> : renames the category-key of the current node') 
    console.log('ctgoto <path> : goes to the specified path ex: ctpath a b c')
    console.log('----------')
    console.log('cthistoryRevert : reverts back to the historical object identified by the historicalIndex')
    console.log('cthistoryResetIndex : resets the historical index to 0, the last entry in tree history')
    console.log('cthistoryFor : moves forwards through the historical tree')
    console.log('cthistoryBack : moves backwards through the historical tree')
    console.log('----------')
    console.log('cttreeAdd <folder-name> : adds a tree to the tree-folder')
    console.log('cttreeDelete : deletes the selected tree-folder')
    console.log('cttreeList : lists all trees in the tree-folder and the current tree')
    console.log('cttreeSelect <folder-name> : selects a tree in the tree-folder')
}

module.exports = { 

    /*
        regular commands
    */

    refresh: refresh,
    add: add, 
    remove: remove,
    showPlace: showPlace,
    edit: edit,
    list: list, 
    forward: forward, 
    backward: backward, 
    stateChange: stateChange, 
    help: help, 
    move: moveTrunk, 
    find: find, 
    renameCateogry: renameCategory, 
    goto: goto,

    /*
        history
    */

    moveBackInHistory: moveBackwardInHistory, 
    moveForwardInHistory: moveForwardInHistory,
    resetHistoricalIndex: resetHistoricalIndex,
    revert: revert, 

    /*
        tree
    */

    addTree: addTree, 
    listTrees: listTrees, 
    selectTree: selectTree,
    deleteTree: deleteTree,


}
