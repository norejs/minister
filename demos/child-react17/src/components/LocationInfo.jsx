export default function LocationInfo() {
    const locationInfo = [];
    for (let i in window.location) {
        let value = window.location[i];
        if (typeof value === 'object' || typeof value === 'function') {
            continue;
        }

        locationInfo.push(
            <div key={i}>
                {i}: {value}
            </div>
        );
    }
    return locationInfo;
}
