import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
//import ldBar from './util/loading-bar/loading-bar.js';
import './util/loading-bar/loading-bar.css';
import { createColorPalette } from './color-palette.js';
import styled from 'styled-components';
import { Button, TextField, LinearProgress, Input } from '@material-ui/core';

const ColorPalette = styled.div`
	.dropzone {
		border: dashed 4px yellow;
		background-color: #3aa9bb;
		width: 100px;
		height: 100px;
		display: flex;
		align-items: center;
	}

	.pallet {
		display: block;
		width: 500px;
		height: 300px;
	}

	.pallet div {
		display: inline-block;
	}

	canvas {
		display: block;
	}

	.link {
		stroke: #000;
		stroke-width: 1.5px;
	}

	.node {
		cursor: move;
		fill: #ccc;
		stroke: #000;
		stroke-width: 1.5px;
	}

	.color-chart {
		position: absolute;
	}

	.image-canvas {
		position: absolute;
	}

	svg {
		position: absolute;
		z-index: 1000;
	}
`;

const App = () => {
	const [progressAmount, setProgressAmount] = useState(0);
	const [paletteSize, setPaletteSize] = useState(10);
	const [iterations, setIterations] = useState(10);
	//const bar = ldBar(".ldBar");

	const createPalette = (files) => {
		const i = Number(iterations);
		const ps = Number(paletteSize);
		createColorPalette({
			iterations: i,
			paletteSize: ps,
			files,
			progressCallback: (progress) => {
				setProgressAmount(progress)
				//bar.set(progress)
			}
		});
	}

	useEffect(() => {
		//bar.set(0);
		document.querySelector('.select-image').onchange = function() {
			createPalette(this.files);
		}
	}, []);

	return (
		<ColorPalette>
			<div className="dropzone">
				<Button
					variant="contained"
					component="label"
				>
					select image
					<input
						type="file"
						className={'select-image'}
						hidden
					/>
				</Button>
			</div>

			<form noValidate autoComplete="off">
				<TextField id="iterations" label="iterations" value={iterations} />
				<TextField id="palette-size" label="palette size" value={paletteSize} variant="filled" />
			</form>

			<p>progress: {progressAmount}/{iterations+5}</p>
			<LinearProgress variant="determinate" value={(progressAmount/iterations+5)*100} style={{ width: '20rem' }} />

			<div className="pallet"></div>

			<div className="image-container">
				<canvas className="image-canvas"/>
			</div>
		</ColorPalette>
	);
}

ReactDOM.render(<App />, document.querySelector('.application'));
