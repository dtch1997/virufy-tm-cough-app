let recognizer;
let words;
let wordList;
let modelLoaded = false;
let startTime;
let d = new Date();

$( document ).ready(function() {
    wordList = ["Negative", "Positive"]
    $.each(wordList, function( index, word ) {
        if (!word.startsWith('_')){
            $("#candidate-words").append(`<span class='candidate-word col-md-2 col-sm-3 col-3' id='word-${word}'>${word}</span>`);
        }
    });
});

$("#audio-switch").change(function() {
    if(this.checked){
        if(!modelLoaded){
            loadModel();
        }else{
            startListening();
        }
    }
    else {
        stopListening();
    }
});

function loadModel(){
    $(".progress-bar").removeClass('d-none');
    // When calling `create()`, you must provide the type of the audio input.
    // The two available options are `BROWSER_FFT` and `SOFT_FFT`.
    // - BROWSER_FFT uses the browser's native Fourier transform.
    // - SOFT_FFT uses JavaScript implementations of Fourier transform (not implemented yet).
    const URL = "https://cs329s-edge.s3.us-east-2.amazonaws.com/tm-my-audio-model/";
    const checkpointURL = URL + "model.json"; // model topology
    const metadataURL = URL + "metadata.json"; // model metadata
    console.log("Loading model from " + URL);
    startTime = d.getTime();
    recognizer = speechCommands.create(
            "BROWSER_FFT", // fourier transform type, not useful to change
            undefined, // speech commands vocabulary feature, not useful for your models
            checkpointURL,
            metadataURL);
    Promise.all([
        // Make sure that the underlying model and metadata are loaded via HTTPS requests.
        recognizer.ensureModelLoaded()
      ]).then(function(){
        console.log("Model loaded in " + ((d.getTime() - startTime) / 1000) + " seconds");
        console.log(recognizer.modelInputShape());
        console.log(recognizer.params().sampleRateHz);
        console.log(recognizer.params().fftSize);
        $(".progress-bar").addClass('d-none');
        words = recognizer.wordLabels();
        $.each(words, function( index, word ) {
            if (!word.startsWith('_') && !wordList.includes(word)){
                $("#candidate-words").append(`<span class='candidate-word' id='word-${word}'>${word}</span>`);
            }
        });
        modelLoaded = true;
        startListening();
      })
}

function startListening(){
    // `listen()` takes two arguments:
    // 1. A callback function that is invoked anytime a word is recognized.
    // 2. A configuration object with adjustable fields such a
    //    - includeSpectrogram
    //    - probabilityThreshold
    //    - includeEmbedding
    recognizer.listen(({scores}) => {
        // scores contains the probability scores that correspond to recognizer.wordLabels().
        // Turn scores into a list of (score,word) pairs.
        scores = Array.from(scores).map((s, i) => ({score: s, word: words[i]}));
        // Find the most probable word.
        scores.sort((s1, s2) => s2.score - s1.score);
        $("#word-"+scores[0].word).addClass('candidate-word-active');
        setTimeout(() => {
            $("#word-"+scores[0].word).removeClass('candidate-word-active');
        }, 2000);
    },
    {
        probabilityThreshold: 0.70
    });
}

function stopListening(){
    recognizer.stopListening();
}
