(() => {
  'use strict';

  window.LonecraftSprites={
    player:{
      title:'Player',
      url:'https://opengameart.org/sites/default/files/ninja_3.png',
      source:'https://opengameart.org/content/ninja-npc-sprite-sheet',
      license:'CC0',
      cell:{w:16,h:16,offsetX:0,offsetY:0,gapX:0,gapY:0},
      render:{w:20,h:20,anchorX:10,anchorY:14,collisionR:4.3},
      animation:{axis:'columns',directions:{down:0,up:1,left:2,right:3},idle:[0],walk:[0,1,2,3],attack:[4],fps:7}
    },
    zombie:{
      title:'Zombie',
      url:'https://opengameart.org/sites/default/files/zombie7_0.png',
      source:'https://opengameart.org/content/zombie-rpg-sprites',
      license:'CC0',
      cell:{w:64,h:64,offsetX:0,offsetY:0,gapX:0,gapY:0},
      render:{w:24,h:24,anchorX:12,anchorY:17,collisionR:4.3},
      animation:{axis:'rows',directions:{down:0,left:1,up:2,right:3},idle:[1],walk:[0,1,2],fps:5}
    },
    slime:{
      title:'Slime',
      url:'https://opengameart.org/sites/default/files/smallSlimesSpriteSheet.png',
      source:'https://opengameart.org/content/slimes-32x32',
      license:'CC0',
      cell:{w:32,h:32,offsetX:0,offsetY:0,gapX:0,gapY:0},
      render:{w:20,h:20,anchorX:10,anchorY:14,collisionR:4.3},
      animation:{axis:'rows',directions:{down:3,left:3,right:3,up:3},idle:[0],walk:[0,1,2,3,4,5,6,7],fps:8},
      tierRows:{1:3,2:1,3:2,4:5}
    },
    boss:{
      title:'Air Wizard',
      url:'https://opengameart.org/sites/default/files/black_mage_1.png',
      source:'https://opengameart.org/content/pixel-mage',
      license:'CC0',
      cell:{w:32,h:32,offsetX:0,offsetY:0,gapX:0,gapY:0},
      render:{w:32,h:32,anchorX:16,anchorY:23,collisionR:5.2},
      animation:{axis:'rows',directions:{down:0,left:0,right:0,up:0},idle:[0,1,2,3,4],walk:[0,1,2,3,4],attack:[0,1,2,3,4],fps:6,attackRows:[1,2,3]}
    },
    environment:{
      treeLight:{
        title:'Tree — light',
        url:'https://opengameart.org/sites/default/files/tree-light-green-isaiah658.png',
        source:'https://opengameart.org/content/tree-16x16',
        license:'CC0',
        render:{w:42,h:42,anchorX:21,anchorY:42}
      },
      treeDark:{
        title:'Tree — dark',
        url:'https://opengameart.org/sites/default/files/tree-dark-green-isaiah658.png',
        source:'https://opengameart.org/content/tree-16x16',
        license:'CC0',
        render:{w:42,h:42,anchorX:21,anchorY:42}
      }
    }
  };
})();
