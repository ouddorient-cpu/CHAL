// Minimal Google Maps type declarations for the map page
declare namespace google {
    namespace maps {
        class Map {
            constructor(element: HTMLElement, options?: MapOptions);
            setCenter(latlng: LatLngLiteral): void;
            setZoom(zoom: number): void;
        }
        class Marker {
            constructor(options?: MarkerOptions);
            setMap(map: Map | null): void;
            setPosition(latlng: LatLngLiteral): void;
            addListener(event: string, handler: () => void): void;
        }
        class Size {
            constructor(width: number, height: number);
        }
        interface LatLngLiteral { lat: number; lng: number; }
        interface MapOptions {
            center?: LatLngLiteral;
            zoom?: number;
            disableDefaultUI?: boolean;
            zoomControl?: boolean;
            gestureHandling?: string;
            styles?: any[];
        }
        interface MarkerOptions {
            position?: LatLngLiteral;
            map?: Map;
            icon?: { url: string; scaledSize?: Size };
            title?: string;
            zIndex?: number;
        }
    }
}
