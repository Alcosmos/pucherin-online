<?php
    $dataURL = 'data/tools/public/pucherin/web/';
?>
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Pucherín Online</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="shortcut icon" href="<?=$dataURL?>images/favicon.png" type="image/png">
        <link rel="stylesheet" href="<?=$dataURL?>styles/style.css">
        <link rel="stylesheet" href="<?=$dataURL?>styles/table_style.css">
        <link rel="stylesheet" href="<?=$dataURL?>styles/term_style.css">
    </head>
    <body>
        <div class="side tableSide">
            <div class="container">
                <div id="tablero" class="box"></div>
            </div>
        </div>
        <div class="side termSide">
            <div id="interactor"></div>
            <div id="content">
                <div id="scroller">
                    <!-- Terminal output -->
                </div>
                <form id="writterForm" autocomplete="off">
                    <input type="text" id="writterInput" name="writterInput" autocapitalize="off"><br><br>
                </form>
                <script src="<?=$dataURL?>web_config.js"></script>
				
                <script src="<?=$dataURL?>scripts/commands.js"></script>
                <script src="<?=$dataURL?>scripts/players.js"></script>
                <script src="<?=$dataURL?>scripts/tiles.js"></script>
				
                <script src="<?=$dataURL?>scripts/table.js"></script>
                <script src="<?=$dataURL?>scripts/game.js"></script>
            </div>
            <footer><a href="https://alcosmos.net" target="_blank">Alcosmos</a> 2023 - <a href="https://github.com/Alcosmos/pucherin-online" target="_blank">Código fuente (GitHub)</a></footer>
        </div>
    </body>
</html>
