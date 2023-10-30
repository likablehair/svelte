<svg class="checkmark" width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path class="checkmark__circle" d="M26 45C37.0457 45 46 36.0457 46 25C46 13.9543 37.0457 5 26 5C14.9543 5 6 13.9543 6 25C6 36.0457 14.9543 45 26 45Z" fill="#D31010"/>
  <path class="checkmark__check" fill-rule="evenodd" clip-rule="evenodd" d="M25.9971 25.378L17.6936 34.0028L17 33.2824L25.3035 24.6576L17.662 16.7204L18.3555 16L25.9971 23.9372L33.6386 16L34.3322 16.7204L26.6906 24.6576L34.9941 33.2824L34.3006 34.0028L25.9971 25.378Z" fill="white"/>
</svg>


<style>
.checkmark__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: rgb(var(--global-color-error-600));
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  stroke-width: 2;
  stroke: #fff;
  margin: 2% auto;
  box-shadow: inset 0px 0px 0px rgb(var(--global-color-error-600));
  animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
}

.checkmark__check {
  transform-origin: 50% 50%;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}
@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 30px rgb(var(--global-color-error-600));
  }
}

</style>