export class Basic
{
    constructor(context, neuronCount, layerCount)
    {
        if(neuronCount > 4096)
        {
            console.error('Unable to process layer, neuron limit of 4096 reached.');
            return;
        }

        this.neurons =  buildTexture(context, neuronCount, 'neurons', layerCount,);
    }

    logInitialValues()
    {
        this.neurons.log();
        console.log('\n');
    }
}

export class Forward_Prop extends Basic
{
    constructor(context, neuronCount, layerCount, weightsCount)
    {
        super(context, neuronCount, layerCount);

        this.weights = buildTexture(context, weightsCount, 'weights', layerCount,);
        this.adjustedWeights = buildTexture(context, weightsCount, 'adjusted weights', layerCount, 'empty');
        this.biases = buildTexture(context, neuronCount, 'biases', layerCount, 1);
    }

    logInitialValues()
    {
        this.neurons.log();
        this.weights.log(); this.adjustedWeights.log();
        this.biases.log();
        console.log('\n');
    }
}

export class Back_Prop extends Forward_Prop
{
    constructor(context, neuronCount, layerCount, weightsCount, desired)
    {
        super(context, neuronCount, layerCount, weightsCount);

        desired = desired | 'empty';
        this.desiredOut = buildTexture(context, neuronCount, 'desired outputs', layerCount, desired);

        this.biasDeltaSum = buildTexture(context, neuronCount, 'bias delta sum', layerCount, 'empty');
        this.weightDeltaSum = buildTexture(context, neuronCount, 'weight delta sum', layerCount, 'empty');
        this.desiredDeltaSum = buildTexture(context, neuronCount, 'desired delta sum', layerCount, 'empty');
    }
}

function buildTexture(context, size, type, layerNumber, bufferValue)
{
    let width = Math.ceil(Math.sqrt(size));

    let texture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, texture);

    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);

    let debugBuffer = 0;

    if(Array.isArray(bufferValue))
    {
        debugBuffer = bufferValue;
        context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, width, width, 0, context.RGBA, context.UNSIGNED_BYTE, new Uint8Array(new Float32Array(bufferValue).buffer));
    }
    else
    {
        debugBuffer = createGaussianRandomBuffer(width*width, bufferValue);
        context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, width, width, 0, context.RGBA, context.UNSIGNED_BYTE, new Uint8Array(debugBuffer.buffer));
    }

    return {texture: texture, width: width, realCount:size, name: type, layer: layerNumber, initializedValues: debugBuffer,
        log: function()
        {
            console.log(this.name, "from layer", this.layer, "were initialized with:", this.initializedValues);
        }};
}

function createGaussianRandomBuffer(size, bufferValue)
{
    let floatArray = new Float32Array(size);
    let range = Math.sqrt(2/size);

    for(let i = 0; i < size; i++)
    {
        floatArray[i] = i+1;//
        // gaussianRandom(range, bufferValue);
    }
    return floatArray;
}

function gaussianRandom(range, bufferValue)
{
    if(bufferValue)
    {
        if(bufferValue === 'empty')
            return null;
        else
            return bufferValue;
    }

    let outputValue = 0;
    while (outputValue === 0)
    {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); while(v === 0) v = Math.random();
        outputValue = (Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)) * range;
        if(outputValue > range || outputValue < -range) outputValue = 0;
    }
    return outputValue;
}