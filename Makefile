all: src/map.js

src/map.js: resources/tiled/mapa_map.csv resources/tiled/mapa_collisions.csv
	echo "var map = { data: [" > src/map.js
	sed "s/\(^.*$$\)/\1,/" < resources/tiled/mapa_map.csv >> src/map.js
	echo "], collisions: [" >> src/map.js
	sed "s/\(^.*$$\)/\1,/" < resources/tiled/mapa_collisions.csv >> src/map.js
	echo "], rings: [" >> src/map.js
	sed "s/\(^.*$$\)/\1,/" < resources/tiled/mapa_rings.csv >> src/map.js
	echo "], foreground: [" >> src/map.js
	sed "s/\(^.*$$\)/\1,/" < resources/tiled/mapa_foreground.csv >> src/map.js
	echo "]}" >> src/map.js

dialog_tiles.js: resources/tiled/dialog_border.csv
	sed "s/\(^.*$$\)/\1,/" -i resources/tiled/dialog_border.csv
	sed "s/-1,/0,/g" -i resources/tiled/dialog_border.csv
	sed "s/\(^.*$$\)/\1,/" -i resources/tiled/dialog_collisions.csv
	sed "s/-1,/0,/g" -i resources/tiled/dialog_collisions.csv
	sed "s/23,/1,/g" -i resources/tiled/dialog_collisions.csv
	sed "s/\(^.*$$\)/\1,/" -i resources/tiled/dialog_rings.csv
	sed "s/-1,/0,/g" -i resources/tiled/dialog_rings.csv
	sed "s/285,/1,/g" -i resources/tiled/dialog_rings.csv
	echo "var dialog = { data: [" > src/dialog_tiles.js
	cat resources/tiled/dialog_border.csv >> src/dialog_tiles.js
	echo "], collisions: [" >> src/dialog_tiles.js
	cat resources/tiled/dialog_collisions.csv >> src/dialog_tiles.js
	echo "], rings: [" >> src/dialog_tiles.js
	cat resources/tiled/dialog_rings.csv >> src/dialog_tiles.js
	echo "]}" >> src/dialog_tiles.js

