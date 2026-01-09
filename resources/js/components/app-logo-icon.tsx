import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6 2C5.44772 2 5 2.44772 5 3V4H3C2.44772 4 2 4.44772 2 5V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H20C20.5304 22 21.0391 21.7893 21.4142 21.4142C21.7893 21.0391 22 20.5304 22 20V5C22 4.44772 21.5523 4 21 4H19V3C19 2.44772 18.5523 2 18 2H6ZM7 4V3H17V4H7ZM4 6V20H20V6H4ZM8 10C8 11.1046 8.89543 12 10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10ZM12 10C12 11.1046 12.8954 12 14 12C15.1046 12 16 11.1046 16 10C16 8.89543 15.1046 8 14 8C12.8954 8 12 8.89543 12 10Z"
            />
        </svg>
    );
}
