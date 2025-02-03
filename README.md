# command line categorical note tree

- run "npm install -g" to download globally
 
- commands
- cthelp : shows all commands
- ctroot : resets the current node to the root
- ctlist : lists the current nodes categories and their description
- ctadd <category> <description> : adds a category to the current node with a description
- ctdelete : deletes the current node
- ctedit <description> : edits the current nodes description
- ctfor <category> : moves forward into the selected category
- ctback : moves backward from the current node
- ctcurr : shows the current path
- ctstateChange <variable> : disables and enables data variables in treeData.json
- ctmove <path> : moves the current node to the selected path
- ctfind <description> : finds all nodes which contain the input description
- ctrename <name> : renames the category-key of the current node
- ctgoto <path> : goes to the specified path ex: ctpath a b c
  
- cthistoryRevert : reverts back to the historical object identified by the historicalIndex
- cthistoryResetIndex : resets the historical index to 0, the last entry in tree history
- cthistoryFor : moves forwards through the historical tree
- cthistoryBack : moves backwards through the historical tree
  
- cttreeAdd <folder-name> : adds a tree to the tree-folder
- cttreeDelete : deletes the selected tree-folder
- cttreeList : lists all trees in the tree-folder and the current tree
- cttreeSelect <folder-name> : selects a tree in the tree-folder
