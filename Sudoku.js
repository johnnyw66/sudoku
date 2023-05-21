let font;
const CLEARKEY = ' ' ;
const gLevel = 220 ;
const hintsGridLen = 48 ;
const solutionGridLen = 24 ;

const xHints = 100 ;
const yHints = 100 ;
const xSolution = xHints + 10 * hintsGridLen ;
const ySolution = 100 ;

const sectionRectRadius = 4 ;
const sectionEdgeWeight = 4 ;

let whiteColour  ;
let greyColour  ;
let yellowColour ;
let puzzleColour ;
let solutionColour ;

let hotspotManager ;

let xEdit, yEdit ;
let masks= [] ;
let solution = [] ;
let errorSound,hintSound ;
let moves,undo ;
let puzzleMask = 0n ;         // BigInt mask of grids which are part of our puzzle. 
                              // Bit is set for those particular cells which are part of our puzzle using an 81 bit, bitmask 

let canvas ;
let btn ;

class Move {
  
  constructor(cell, val) {
     this.value = val ;
     this.cell = cell ;
  }
  
  getCell() { return this.cell ; }
  
  getValue() { return this.value ; }
  
  isEqual(move) { return ((this.cell === move.getCell()) && (this.value === move.getValue())) ; }
  
  debug() { 
//    console.log("Move : cell =  " + this.cell + " value = " + this.value ) ;
  }
  
}


class Stack {
  
  constructor() {
    this.data = [] ;
    this.top = 0 ;
  }
  
  size() {
    return this.top   ;    
  }
  
  push(element) { 
    this.data[this.top++] = element ;
  } 
  
  isEmpty() {
    return (this.top === 0) ;  
  }
  
  pop() { 
    if (!this.isEmpty()) {
       return this.data[--this.top] ;
    }
    
  }
  
  isEqual(move) {
    return (!this.isEmpty() &&  this.peek().isEqual(move)) ; 
  }
  
  peek() {
    if (!this.isEmpty()) {
      return this.data[this.top - 1] ;
    }
  }
  
  debug() {
    let top = this.top ;
    while (--top >= 0) {
      this.data[top].debug() ;      
    }
  }

}





function preload() {
  font = loadFont('https://raw.githubusercontent.com/google/fonts/master/ofl/alikeangular/AlikeAngular-Regular.ttf');
 // font = loadFont('https://raw.githubusercontent.com/google/fonts/master/ofl/arizonia/Arizonia-Regular.ttf') ;
 
 
 // Define Colour 'constants'
 whiteColour = color(255, 255, 255)  ;
 greyColour  = color(gLevel, gLevel, gLevel) ;
 yellowColour = color(255,255,0)  ;        // Edit Cursor 
 puzzleColour = color(255, 0, 0) ;         // Cells which are part of the puzzle
 solutionColour = color(0, 0, 0) ;         // Font Colour for our solution/answer
 answerColour = color(100, 100, 100) ;
 
 // Sounds
 
 //errorSound = loadSound("doorbell.mp3") ;
// hintSound = loadSound("doorbell.mp3") ;

}


function setup() {
  

  // Sets the screen to be 720 pixels wide and 400 pixels high
  canvas = createCanvas(800, 800).class('mycnv');
  btn = createButton("RESET") ;
  btn.mousePressed( function () { printLogElement("button pressed") ; }) ;
  
  let p = createElement("p",'Paragraph Element').class('log') ;
  
  background(whiteColour);
  noSmooth();
  
  
  moves = new Stack() ;
  redo = new Stack() ;
  // reset solution and hints 
  resetPuzzle() ;
  
}


function draw() {
  //rect(mouseX, mouseY, 10, 10);
  
  //canvas.position(mouseX, mouseY) ;
  
  drawSudokuBox(xHints,yHints,hintsGridLen) ;
  drawSudokuBox(xSolution,ySolution,solutionGridLen) ;
  drawCurrentEditCell(xEdit, yEdit) ;
    
  drawPossibleSolutions(xHints,yHints,hintsGridLen) ;
  //drawCurrentAnswer(xSolution,ySolution) ;
  drawSolutionSet(xSolution, ySolution, solutionGridLen) ;

  
}


function printLogElement(str) {
   let p = createElement("p",str).class('log') ;
}

function resetPuzzle() {
  clearAllCells() ;
  puzzleMask = 0n ;
  
  // Puzzle 94
  // Row 0
//  placeSolutionAtCell(1,0,0) ;
  placePuzzleSolutionAtRowCol(2,0,1) ;
  placePuzzleSolutionAtRowCol(8,0,4) ;
  placePuzzleSolutionAtRowCol(4,0,8) ;
  
  // Row 1
  placePuzzleSolutionAtRowCol(1,1,0) ;
  placePuzzleSolutionAtRowCol(5,1,2) ;

  // Row 2
  placePuzzleSolutionAtRowCol(6,2,2) ;
  placePuzzleSolutionAtRowCol(5,2,5) ;
  placePuzzleSolutionAtRowCol(2,2,7) ;
   
  // Row 3
  
  placePuzzleSolutionAtRowCol(9,3,2) ;
  placePuzzleSolutionAtRowCol(7,3,4) ;
  placePuzzleSolutionAtRowCol(2,3,6) ;
  placePuzzleSolutionAtRowCol(8,3,8) ;

  // Row 4
  
  placePuzzleSolutionAtRowCol(8,4,3) ;
  placePuzzleSolutionAtRowCol(6,4,5) ;

  
  // Row 5
  
  placePuzzleSolutionAtRowCol(8,5,0) ;
  placePuzzleSolutionAtRowCol(1,5,2) ;
  placePuzzleSolutionAtRowCol(4,5,4) ;
  placePuzzleSolutionAtRowCol(3,5,6) ;

  // Row 6
  
  placePuzzleSolutionAtRowCol(1,6,1) ;
  placePuzzleSolutionAtRowCol(5,6,3) ;
  placePuzzleSolutionAtRowCol(4,6,6) ;

  // Row 7
  placePuzzleSolutionAtRowCol(7,7,6) ;
  placePuzzleSolutionAtRowCol(1,7,8) ;
  

  // Row 8
  
  placePuzzleSolutionAtRowCol(4,8,0) ;
  placePuzzleSolutionAtRowCol(9,8,4) ;
  placePuzzleSolutionAtRowCol(5,8,7) ;
  


 
}

function clearAllCells() {
    for(let cell = 0 ; cell < 81 ; cell++) {
    clearSolution(cell) ;
  }
}

function clearDownMasks() {
  let cSolution = [] ;
  
  for(let cell = 0 ; cell < 81 ; cell++) {
      masks[cell] = (1 << 9) - 1;
  }
 
  for(let cell = 0 ; cell < 81 ; cell++) {
        placeSolutionAtCell(solution[cell],cell) ;
  }
  
}
function clearSolution(cellno) {
  masks[cellno] = (1 << 9) - 1;
  solution[cellno] = 0 ;
}

function placePuzzleSolutionAtRowCol(soln, row, col) {
  placePuzzleSolutionAtCell(soln, row * 9 + col ) ;

}

function placePuzzleSolutionAtCell(soln, gridNumber) {
  puzzleMask |= (1n << BigInt(gridNumber)) ;
  placeSolutionAtCell(soln,gridNumber) ;
}

function placeSolutionAtRowCol(soln, row, col) {
  placeSolutionAtCell(soln, row * 9 + col) ;
}

function placeSolutionAtCell(soln,cellno) {
  
  //console.log("placeSolutionAtCell " + soln + " at cell " + cellno) ;
  
  let bitmask = 1 << (soln - 1) ;
  if (soln != 0) {
    masks[cellno] =  1 << (soln - 1)  ; 
  }
  solution[cellno] = soln;
  
  resetColumnHintsFromCell(cellno,soln) ;
  resetRowHintsFromCell(cellno,soln) ;
  resetSectorHintsFromCell(cellno,soln) ;
}



function resetColumnHintsFromCell(cellno, soln) {
  let bitmask = (1 << (soln - 1)) ;
  let col = (cellno % 9) ;
  
  for(let row = 0 ; row < 9 ; row++) {
    let rcellno = row * 9  + col ;
    if (cellno != rcellno) {
      masks[rcellno] &=  ~bitmask  ;  
    }
  }
  
}

function resetRowHintsFromCell(cellno, soln) {
  let bitmask = (1 << (soln - 1)) ;
  let row = (cellno / 9) >> 0 ;

  for(let col = 0 ; col < 9 ; col++) {
    let rcellno = row * 9  + col ;
    if (cellno != rcellno) {
      masks[rcellno] &=  ~bitmask  ;  
    }
  }
}

function resetSectorHintsFromCell(cellno, soln) {
  
    let bitmask = (1 << (soln - 1)) ;
    let row = (cellno / 9) >> 0 ;
    let col = (cellno % 9) ;

    let colsec = ( col / 3) >> 0 ;
    let rowsec = (row / 3 ) >> 0 ;
    let sector = rowsec *  3 + colsec ;
    
    for (let cell = 0 ; cell < 81 ; cell++) {
        let crow = (cell / 9) >> 0 ;
        let ccol = (cell % 9) ;

       let csector = ((crow / 3) >> 0) *  3 + ((ccol / 3) >> 0) ;
    
      if ((cellno != cell) && (sector == csector)) {
           masks[cell] &=  ~bitmask  ;  
      }
      
    }
    
}

function isPowerOf2(n) {
  return (n != 0 && (n & (n-1)) == 0) ;
}

function drawPossibleSolutions(xStart,yStart,gridLen) {
  
  for (let gridNumber = 0 ; gridNumber < 81 ; gridNumber++) {
      
      let ry = (gridNumber / 9) >> 0 ;
      let rx = (gridNumber % 9) ;
      
      let midx = (rx > 2) && (rx < 6) ;
      let midy = (ry > 2) && (ry < 6) ;
      
      let boxColour = (midx ^ midy) ? greyColour : whiteColour;
      
      let mask = masks[gridNumber] ;
      // equiv to if (solution[gridNumber] != 0) {
     if (solution[gridNumber] != 0) {
 //      if (isPowerOf2(mask)) {
        let dCol = (isEditable(gridNumber)) ? solutionColour : answerColour; 
        drawDigit("" + solution[gridNumber], dCol, xStart + (rx + 0.5) * gridLen, yStart + (ry + 0.5) * gridLen,gridLen) ;
      } else {
        drawPossibleNumbersMask(xStart + rx * gridLen,yStart + ry * gridLen, mask, gridLen, boxColour) ;
      }
      
    }
}

function drawSudokuBox(xStart,yStart,gridLen) {
  

    // Draw each of the 91 boxes using default colours
    
    for (let gridNumber = 0 ; gridNumber < 81 ; gridNumber++) {
     
      let ry = (gridNumber / 9) >> 0 ;
      let rx = (gridNumber % 9) ;
      let midx = (rx > 2) && (rx < 6) ;
      let midy = (ry > 2) && (ry < 6) ;
      
      let boxColour = (midx ^ midy) ? greyColour : whiteColour;
      drawSubSections(xStart + rx * gridLen,yStart + ry * gridLen, gridLen,boxColour) ;

    }

    // Draw edges to highlite each of the 9 sections 
    
    stroke(0);
    strokeWeight(sectionEdgeWeight);
    noFill() ;
    for (let section = 0 ; section < 9 ; section++) {
      let ry = (section / 3) >> 0 ;
      let rx = (section % 3) ; 
      rect(xStart + rx * gridLen * 3, yStart + ry * gridLen * 3, gridLen * 3, gridLen * 3, sectionRectRadius) ;
    }
    
    
}

function drawSubSections(xSection, ySection, boxLen, boxColour)
{
  
  //let xSection = x ;
  //let ySection = y ;

  let boxOutlineColour = color(0,0,0) ;
  
  let oddDigitColour = color(255,0,0) ;
  let evenDigitColour = color(0,0,0) ;
  let notPossibleDigitColour = boxColour ;
  
  let sw = 1 ;

  let gapSize = boxLen / 3 ;
  let fsz = gapSize - 2 * sw;

  
  stroke(boxOutlineColour);
  strokeWeight(sw);
  fill(boxColour) ;
  rect(xSection, ySection, boxLen, boxLen) ;
  
  
}


function produceLists() {
  rowList = [] ;
  
  for(let grid = 0 ; grid < 81 ; grid++) {
    
      let row = (grid % 9)  ;
      let col = (grid / 9) >> 0 ;
      let sect = ((row / 3 ) >> 0) *  3 + (( col / 3) >> 0) ;
  }
}

function drawPossibleNumbersMask(xSection, ySection, mask, boxLen,boxColour)
{
  
  
  let oddDigitColour = color(255,0,0) ;
  let evenDigitColour = color(0,0,0) ;
  let notPossibleDigitColour = boxColour ;
  
  let sw = 1 ;

  let gapSize = boxLen / 3 ;
  let fsz = gapSize - 2 * sw;

  
  let digitPositions = [0,1,2,
                        3,4,5,
                        6,7,8] ;
 

  
  for(let digit = 0 ; digit < 9 ; digit++) {
      let digitPosIndex = digitPositions[digit] ;
      
      
      let rx = (digitPosIndex % 3) + 0.5 ;
      let ry = ((digitPosIndex / 3) >> 0) + 0.5 ;
      let tDigit = "" + (digit + 1)  ;
  
      let tCol =  (((1 << digit) & mask) == 0) ? notPossibleDigitColour : (((digitPosIndex & 1) == 0 ) ? oddDigitColour  : evenDigitColour) ;
      drawDigit(tDigit, tCol, xSection + rx * gapSize ,ySection + ry * gapSize,fsz) ;
      
    }
  
}

function drawSolutionSet(xStart, yStart, gapSize) {
      let sw = 1 ;
      let fsz = gapSize - 2 * sw;

      for (let gridNumber = 0 ; gridNumber < 81 ; gridNumber++) {
        let soln = solution[gridNumber] ;
        if (soln != 0) {
          let dCol = (isEditable(gridNumber)) ? solutionColour : answerColour; 
          let ry = ((gridNumber / 9) >> 0)  + 0.5;
          let rx = (gridNumber % 9)  + 0.5 ;
          let tDigit = "" + soln  ;
          drawDigit(tDigit, dCol, xStart + rx * gapSize ,yStart + ry * gapSize,fsz) ;
        }
        

    }
}

function drawDigit(txt, textColour, x, y, sz) {
   
   let bbox = font.textBounds(txt, 0, 0, sz);
   let hgt = bbox.h ;
   let wid = bbox.w ;
   
   fill(textColour);
   noStroke();
   textFont(font);
   textSize(sz);
   text(txt, x - wid/2, y + hgt / 2 );
}





function mousePressed() {

}

function drawCurrentEditCell(xCell, yCell) {

      
  if ((typeof xCell != 'undefined')) {

    let gridNumber = xCell + 9 * yCell ;
     let hColour = isEditable(xCell + 9 * yCell) ? yellowColour : puzzleColour ;
     
     fill(hColour);
     stroke(0);
     strokeWeight(1) ;
     rect(xSolution + xCell * solutionGridLen, ySolution + yCell * solutionGridLen, solutionGridLen, solutionGridLen) ;
  
     noFill() ;
     stroke(hColour) ;
     strokeWeight(2) ;
     rect(xHints + xCell * hintsGridLen, yHints + yCell * hintsGridLen, hintsGridLen, hintsGridLen,4) ;

  }
  
}

function mouseReleased() {
  mouseEvent() ;
}


function mouseEvent() {

    if (mouseX > xSolution && mouseX < xSolution + 9 * solutionGridLen) {
      if (mouseY > ySolution && mouseY < ySolution + 9 * solutionGridLen) {
        xEdit = ((mouseX - xSolution) / solutionGridLen) >> 0 ;
        yEdit = ((mouseY - ySolution) / solutionGridLen) >> 0 ;
      }
    } else
    if (mouseX > xHints && mouseX < xHints + 9 * hintsGridLen) {
      if (mouseY > yHints && mouseY < yHints + 9 * hintsGridLen) {
        xEdit = ((mouseX - xHints) / hintsGridLen) >> 0 ;
        yEdit = ((mouseY - yHints) / hintsGridLen) >> 0 ;
      }
    }
    
    //let gridNumber = yEdit * 9 + xEdit ;
    //console.log("Grid " + gridNumber + " mask = " + masks[gridNumber]) ;
    
}


function mouseMoved() {
}


// Check puzzle Mask to see if this particular cell is 'editable'. i.e it is not part of the puzzle.

function isEditable(cell) {
  return (puzzleMask & (1n << BigInt(cell) )) === 0n ;
}



function isAllowed(digit,cell) {
  return masks[cell] & (1 << (digit - 1)) ;
}

function setGridUsingKeyValue(kValue,gridNumber) {
    //console.log("Key " + kValue) ;
    //console.log("Stack Sz = " + moves.size() ) ;
    
    let oldValue = solution[gridNumber] ;
    let oldMove = new Move(gridNumber,oldValue) ;
    
    if (!moves.isEqual(oldMove)) {
      // only save unique moves on the top of the stack.
      moves.push(oldMove) ;
    }
    
    solution[gridNumber] = 0 ;
    clearDownMasks() ;

    if (kValue != CLEARKEY) {
        let digit = (kValue - '0') ;
        if (isAllowed(digit,gridNumber)) {
          // Number is allowed - so push old value onto stack.
          placeSolutionAtRowCol(digit, yEdit, xEdit) ;
        } else {
          errorSound.play() ;
          if (oldValue != 0) {
            placeSolutionAtRowCol(oldValue, yEdit, xEdit) ;
         }
        }
    }
}

function undoMove() {
  
  if (!moves.isEmpty()) {
      let move = moves.pop() ;
      let gridNumber = move.getCell() ;
      let digit = move.getValue() ;
      redo.push(move) ;
      solution[gridNumber] = digit ;
      clearDownMasks() ;
      placeSolutionAtCell(digit, gridNumber) ;
    } 
   
  
}

function keyPressed() {

  // Edit Keys
  
  if (typeof xEdit != 'undefined') {
    
      if (keyCode === LEFT_ARROW) {
        xEdit = (xEdit == 0) ? (9 - 1) : --xEdit;
      } else if (keyCode === RIGHT_ARROW) {
        xEdit = (xEdit + 1) % 9;
      } else if (keyCode === DOWN_ARROW) {
        yEdit = (yEdit + 1) % 9;
      } else if (keyCode === UP_ARROW) {
        yEdit = (yEdit == 0) ? (9 - 1) : --yEdit;
      }
      
      
      if (key > '0' && key <= '9' || key == CLEARKEY) {
        let gridNumber = xEdit + 9 * yEdit ;
        if (isEditable(gridNumber)) {
          setGridUsingKeyValue(key,gridNumber) ;
        }
      } else if (key == 'r' || key == 'R') {
        
      } else if (key == 'u' || key == 'U') {
        
          undoMove() ;
  
    } else if (key == 's' || key == 'S') {
        
        let gridNumber = xEdit + 9 * yEdit ;
        getHintsForGridSingles(gridNumber) ;
    
    } else if (key == 'd' || key == 'D') {
  
        let gridNumber = xEdit + 9 * yEdit ;
        getHintsForGridDoubles(gridNumber) ;
  
    } else if (key == 't' || key == 'T') {
        
    }
    
  } //if typeof xEdit != 'undefined'
  
  return false ;
}

function getColFromGrid(grid) {
     return (grid % 9) ;
}

function getRowFromGrid(grid) {
  
    return (grid / 9) >> 0 ;
}

function getSectorFromGrid(grid) {
    return ((getRowFromGrid(grid) / 3 ) >> 0) *  3 + (( getColFromGrid(grid) / 3) >> 0) ;
}




function resetBitXXX(gridNumber, digit ) {
  let wRow = getRowFromGrid(gridNumber) ;
  let wCol = getColFromGrid(gridNumber) ;
  let wSect = getSectorFromGrid(gridNumber) ;
  let bit = ~(1 << (digit - 1)) ;
  
  for(let grid = 0 ; grid < 81 ; grid++) {
    let row = getRowFromGrid(grid) ;
    let col = getColFromGrid(grid) ;
    let sect = getSectorFromGrid(grid) ;

    if (grid != gridNumber) {
      //if (wRow == getRowFromGrid(grid) 
      if (wRow == row || wCol == col || wSect == sect) {
        masks[grid] &= bit ;
      }
      
    }
  }
  
}


function keyTyped() {
  return false ;
}

function getRowSet(grid) {
  set = [] ;
  let row = getRowFromGrid(grid) ;
  for(let i = 0 ; i < 9 ; i++) {
    let gridNumber = row * 9 + i ;
    set[i] = gridNumber ;
  }
  return set ;

}

function getColumnSet(grid) {

  set = [] ;
  let col = getColFromGrid(grid) ;
  
  for(let i = 0 ; i < 9 ; i++) {
    let gridNumber = i * 9 + col ;
    set[i] = gridNumber ;
  }
  return set ;

}

function getSectorSet(grid) {
  set = [] ;
  let row = getRowFromGrid(grid) ;
  let col = getColFromGrid(grid) ;
  let sect = getSectorFromGrid(grid) ;
  let pos = 0 ;
  
  for(let grdNo = 0 ; grdNo < 81 ; grdNo++) {
      if (sect == getSectorFromGrid(grdNo)) {
        set[pos++] = grdNo ;
      }
  }
  return set ;
}



function getHintsForGridDoubles(gridNumber) {
    console.log("getHintsForGrid " + gridNumber) ;
    
    let columnSet = getColumnSet(gridNumber) ;
    let rowSet = getRowSet(gridNumber) ;
    let sectorSet = getSectorSet(gridNumber) ;

    console.log("**AnalyseSetForDoubles Columns**") ;
    analyseSetForDoubles(columnSet) ;

    console.log("**AnalyseSetForDoubles Rows**") ;
    analyseSetForDoubles(rowSet) ;

    console.log("**AnalyseSetForDoubles Sector**") ;
    analyseSetForDoubles(sectorSet) ;

    
}

function getHintsForGridSingles(gridNumber) {
    console.log("getHintsForGridSingles " + gridNumber) ;
    
    // 1st Level of Hints - 'Singletons'
    let columnSet = getColumnSet(gridNumber) ;
    let rowSet = getRowSet(gridNumber) ;
    let sectorSet = getSectorSet(gridNumber) ;
    
    console.log("**AnalyseColumnSet**") ;
    analyseSetForSingletons(columnSet) ;
    
    console.log("**AnalyseRowSet**") ;
    analyseSetForSingletons(rowSet) ;
    
    console.log("**AnalyseSectionSet**") ;
    analyseSetForSingletons(sectorSet) ;

    
}


function analyseSetForDoubles(set) {
  
    let sums = peekSet(set) ;
        
    //console.log("Sums Set [") ;
    //let d = 0 ;
    //sums.forEach(sum => {
      //d = d + 1 ;
      //if (sum != 0) {
    //    console.log("Digit " + d + " mentioned " + sum + " time(s)") ;
      //}
    //}) ;
    //console.log("]") ;


    console.log("Doubles  Set [") ;
    let digit = 0 ;
    let wantedSum = 2 ;
    sums.forEach(sum => {
      digit = digit + 1 ;
      if (sum == wantedSum) {
        console.log("*** Digit " + digit + " doubles ****") ;
        hintSound.play() ;
      }
    }) ;
    console.log("]") ;

}

function analyseSetForSingletons(set) {
  
    let sums = peekSet(set) ;
        
    //console.log("Sums Set [") ;
    //let d = 0 ;
    //sums.forEach(sum => {
      //d = d + 1 ;
      //if (sum != 0) {
    //    console.log("Digit " + d + " mentioned " + sum + " time(s)") ;
      //}
    //}) ;
    //console.log("]") ;


    console.log("Singletons  Set [") ;
    let digit = 0 ;
    let wantedSum = 1 ;
    sums.forEach(sum => {
      digit = digit + 1 ;
      if (sum == wantedSum) {
        console.log("*** Digit " + digit + " singleton ****") ;
        hintSound.play() ;
      }
    }) ;
    console.log("]") ;

}



// Solver

function peekSet(gridSetArray) 
{
    gridSums = [] ;
    for(let i = 0 ; i < 9 ; i++) {
      gridSums[i] = 0 ;  
    }
    
    gridSetArray.forEach(grid => 
      {
        let mask = masks[grid] ;
        // Only look at Grid Cells which have no entry.
        if (solution[grid] === 0) {
          //console.log("PeekSet gridNumber " + grid + "current value " +  solution[grid] + " mask = " + mask) ;
          for(let bit = 0 ; bit < 9 ; bit++) {
            gridSums[bit] += ((mask & (1 << bit)) != 0 ? 1 : 0) ;
          }
        }
        
      }
      );
     return gridSums ;   
}
