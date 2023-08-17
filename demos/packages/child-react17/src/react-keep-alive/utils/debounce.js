export default function debounce(fn, threshold = 16) {
    var timer;

    return function() {
        var context = this;
        var args = arguments;

        if (timer) clearTimeout(timer);

        timer = setTimeout(function() {
            fn.apply(context, args);
        }, threshold);
    };
}
