var data = {
    accuracy: {
        mean: 0.9224140048027039,
        std: 0.0035994364880025387,
        ci95: 0.004073145825547285,
    },
    auroc_macro: {
        mean: 0.9496479034423828,
        std: 0.007111789658665657,
        ci95: 0.008047747600747203,
    },
    auroc_weighted: {
        mean: 0.9339280128479004,
        std: 0.006949717178940773,
        ci95: 0.007864345324744315,
    },
    f1_macro: {
        mean: 0.7213900089263916,
        std: 0.018348950892686844,
        ci95: 0.02076379260499035,
    },
    f1_weighted: {
        mean: 0.9207738041877747,
        std: 0.0031727037858217955,
        ci95: 0.0035902523142141906,
    },
    inference_img_per_s: {
        mean: 339.2319030761719,
        std: 5.660897254943848,
        ci95: 6.405908285833423,
    },
    inference_ms_per_image: {
        mean: 2.9483888149261475,
        std: 0.049679290503263474,
        ci95: 0.056217409420609224,
    },
    precision_macro: {
        mean: 0.877139151096344,
        std: 0.06310564279556274,
        ci95: 0.07141075731658894,
    },
    precision_weighted: {
        mean: 0.9227018356323242,
        std: 0.0036525309551507235,
        ci95: 0.004133227871152234,
    },
    recall_macro: {
        mean: 0.6724334359169006,
        std: 0.011852629482746124,
        ci95: 0.013412512892038006,
    },
    recall_weighted: {
        mean: 0.9224140048027039,
        std: 0.0035994364880025387,
        ci95: 0.004073145825547285,
    },
    _meta: {
        eval_batch_size: 32,
        split: "test",
    },
};
var round = function (num, places) {
    if (places === void 0) { places = 3; }
    var factor = Math.pow(10, places);
    return Math.round(num * factor) / factor;
};
console.log("".concat(round(data.accuracy.mean), " ").concat(round(data.auroc_macro.mean), "/").concat(round(data.auroc_weighted.mean), " ").concat(round(data.precision_macro.mean), "/").concat(round(data.precision_weighted.mean), " ").concat(round(data.recall_macro.mean), "/").concat(round(data.recall_weighted.mean), " ").concat(round(data.f1_macro.mean), "/").concat(round(data.f1_weighted.mean)));
