import * as Utils from './Shader_Program_Utilities.js'
import * as Layer from './NN_Layer.js';
import * as Shader_Source from './Shader_Source.js';

class Neural_Network_Base
{
    constructor(context, inputSize)
    {
        this.context = context;
        this._neuronsPerLayer = [inputSize, 2, 2, 2];

        this.vertexShader = Utils.compileShader(context, context.VERTEX_SHADER, Shader_Source.basicVertexShader);

        context.bindFramebuffer(context.FRAMEBUFFER, context.createFramebuffer());

        const weightAdjustmentSource = Shader_Source.weightAdjustmentHeader + Shader_Source.commonUtilities + Shader_Source.weightAdjustmentMain;
        this.weightAdjustmentProgram = Utils.createProgram(context, this.vertexShader, Utils.compileShader(context, context.FRAGMENT_SHADER, weightAdjustmentSource));

        const sumSource = Shader_Source.sumHeader + Shader_Source.commonUtilities + Shader_Source.sumMain;
        this.sumProgram = Utils.createProgram(context, this.vertexShader, Utils.compileShader(context, context.FRAGMENT_SHADER, sumSource));

        this.vertexBufferParams = Utils.initBasicVertexBuffer(context, context.getAttribLocation(this.weightAdjustmentProgram, 'vertexPosition'));
        Utils.initBasicVertexBuffer(context, context.getAttribLocation(this.sumProgram, 'vertexPosition'));

        this.layers = [];
    }
    calculateOutput()
    {
        for(let i = 1; i < this._neuronsPerLayer.length; i++)
        {
            Utils.setupContext(i, this.context, this.weightAdjustmentProgram, this.layers[i].adjustedWeights.texture, [
                    {name: 'weightWidth', value: this.layers[i].adjustedWeights.width},
                    {name: 'weightsCount', value: this.layers[i].weights.realCount},
                    {name: 'previousNeuronWidth', value: this.layers[i-1].neurons.width},
                    {name: 'previousNeuronCount', value: this.layers[i-1].neurons.realCount},
                    {name: 'outputWidth', value: this.layers[i].neurons.width}],
                [
                    {name: 'inputNeurons', value: this.layers[i-1].neurons.texture},
                    {name: 'weights', value: this.layers[i].weights.texture}]);

            this.context.drawArrays(this.context.TRIANGLE_STRIP,0 ,this.vertexBufferParams.size * .5);
            Utils.logFramebufferTexture(this.context, this.layers[i].adjustedWeights.width, 'weight adjustment', i);

            Utils.setupContext(i, this.context, this.sumProgram, this.layers[i].neurons.texture, [
                    {name: 'adjustedWeightsWidth', value: this.layers[i].adjustedWeights.width},
                    {name: 'inputCount', value: this.layers[i-1].neurons.realCount},
                    {name: 'outputWidth', value: this.layers[i].neurons.width},
                    {name: 'outputCount', value: this.layers[i].neurons.realCount}],
                [
                    {name: 'adjustedWeights', value: this.layers[i].adjustedWeights.texture},
                    {name: 'biases', value: this.layers[i].biases.texture}]);

            this.context.drawArrays(this.context.TRIANGLE_STRIP,0 ,this.vertexBufferParams.size * .5);
            Utils.logFramebufferTexture(this.context, this.layers[i].neurons.width, 'sum, bias and leaky relu', i);
        }
    }
}

export class Forward_Propagation extends Neural_Network_Base
{
    constructor(context, inputSize)
    {
        super(context, inputSize);
        
        this.layers = [new Layer.Basic(context, this._neuronsPerLayer[0], 0)];

        for(let i = 1; i < this._neuronsPerLayer.length; i++)
        {
            this.layers.push(new Layer.Forward_Prop(context, this._neuronsPerLayer[i], i, this._neuronsPerLayer[i] * this._neuronsPerLayer[i-1]));
        }
    }
}

export class Back_Propagation extends Neural_Network_Base
{
    constructor(context, inputSize)
    {
        super(context, inputSize);

        // const adjustedErrorSource = Shader_Source.sumHeader + Shader_Source.commonUtilities + Shader_Source.sumMain;
        // this.adjustedErrorProgram = createProgram(context, this.vertexShader, compileShader(context, context.FRAGMENT_SHADER, sumSource));

        this.layers = [new Layer.Basic(context, this._neuronsPerLayer[0], 0)];
        //https://stackoverflow.com/questions/51793336/webgl-2-0-multiple-output-textures-from-the-same-program
        for(let i = 1; i < this._neuronsPerLayer.length; i++)
        {
            this.layers.push(new Layer.Back_Prop(context, this._neuronsPerLayer[i], i, this._neuronsPerLayer[i] * this._neuronsPerLayer[i-1]));
        }
    }
    calculateChangeFromImage()
    {
        this.calculateOutput();
        //setupContext(this._neuronsPerLayer.length-1, this.context, ?, ?, ?, ?)
    }
    updateNetwork()
    {

    }
}