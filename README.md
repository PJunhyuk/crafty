# CRAFTY


## 간단한 소개
`crafty` 는 프로그래밍을 처음 접하거나 함수형 언어에 익숙하지 않은 사람들이 코드가 아닌 블록을 이용하여 함수형 프로그래밍을 익힐 수 있게 해주는 `함수형 언어 비쥬얼 프로그래밍 툴`입니다.

[![소개 ](https://img.youtube.com/vi/5NUdw5i-3i8/0.jpg)](https://www.youtube.com/watch?v=5NUdw5i-3i8)



## 프로젝트 설명
crafty는 프로그래밍 지식이 충분한 개발자들도 재미있게 사용할 수 있는 비쥬얼 프로그래밍 GUI 입니다. 초심자가 접근하기 가장 쉬운 함수형 언어의 형식이며, 비쥬얼 프로그래밍에 최적화된 프로그래밍 언어 pastel을 개발하여 사용합니다. 또한, 모든 플랫폼의 사용자가 쉽게 사용할 수 있도록 웹 기반의 서비스를 제공합니다.
프로그래밍을 처음 접하는 학생들은 crafty에서 제공하는 비쥬얼 툴을 이용하여 프로그래밍의 기초가 되는 알고리즘을 학습할 수 있으며, 프로그래밍 지식이 충분한 개발자들은 pastel 언어를 활용하여 좀 더 세부적인 작업을 진행할 수 있습니다. 이렇게 수정된 모든 결과물은 실시간으로 확인할 수 있으며, crafty를 활용하여 수준 프로그램을 작성할 수 있기 때문에 사용자들의 흥미를 야기할 수 있을 것으로 기대됩니다.
초심자도 쉽게 활용할 수 있는 비쥬얼 프로그래밍 툴을 적용하였으며, 최적화된 프로그래밍 언어로 구현된 crafty가 학생들에게 프로그래밍에 대한 관심을 유발할 수 있는 소프트웨어 교육의 메소드로서 작용할 것이라 생각합니다.


## 프로젝트 구조

### Pastel language
crafty에 최적화 된 프로그래밍 언어인 pastel은 함수형 프로그래밍 언어입니다. 대표적인 함수형 프로그래밍 언어인 clojure를 참고하였으며, 크래프티 팀의 프로그래밍 언어 철학을 적용하여 독자적으로 개발되었습니다. pastel 코드를 실행할 수 있는 compiler, evaluator, lexer, parser, transpiler은 모두 javascript 기반으로 작성되어, 웹에서 컴파일을 진행할 수 있습니다.
pastel-lang 이라는 npm 역시 자체 제작하여 제공하고 있습니다.

#### 설계 철학
기본적인 설계 철학이자, 다른 함수형 언어들과 구분되는 세 가지 특징은 다음과 같습니다.

1. 모든 것은 배열(Array)과 그 하위 배열(Sub-Array)의 표기로 이루어진다. 예외는 없다.

2. 함수의 다형성(Polymorphism)을 구조적으로 강제한다. (동적 함수 이름과, 접두사를 통한 실행 특성 지정)

3. 모든 정의는 순서 독립적으로 처리된다.


### 크래프티(crafty)
<크래프티>는 pastel을 활용하여 웹에서 비쥬얼 프로그래밍을 진행할 수 있는 GUI입니다. 화면의 왼쪽에는 블록 형태의 crafty-canvas가, 오른쪽에는 crafty-editor가 위치하여 GUI와 코드를 동시에 볼 수 있는 것이 특징입니다. crafty-canvas와 crafty-editor는 실시간으로 동기화됩니다.
crafty로 제작한 코드는 crafty-box라는 툴을 이용하여 저장하거나 불러오고, 다른 사람들과 공유할 수 있습니다.


모든 개발은 babel을 활용하여 ECMAScript6로 제작되어, 현재 최신 기술을 반영합니다.


### crafty-canvas
crafty-canvas 는 비쥬얼 프로그래밍을 가능케하는 드랙-앤-드랍 인터페이스입니다.  블록 형태로 코드를 작성, 수정, 확인할 수 있으며 픽시JS(Pixi.js)라는 비쥬얼 컴포넌트 라이브러리를 활용하여 제작되었습니다.
구조
crafty-canvas 의 해심 기능은 아래 파일로 나누어져 연동되어 작동합니다.


### crafty-box
crafty-box는 crafty-canvas의 내용들을 저장하고, 로드하고, 수정할 수 있는 crafty 통합 플랫폼입니다.


## 사용 방법



Menu : Menu 버튼을 클릭하면 새로운 함수를 선언하는 define 버튼, canvas의 모든 block들을 삭제하는 clean canvas 버튼, 화면에 눈이 내리게 하는 snowing checkbox, crafty-canvas의 background를 우주 테마로 설정하는 space theme checkbox, 그리고 crafty-box를 위한 save, save as, load, new 버튼이 dropdown 형식으로 나옵니다.



snowing & space theme : Menu에서 snowing checkbox와 space theme checkbox를 check하면 다음과 같이 인터페이스가 변화합니다.



fold : depth가 2 이상인 block을 클릭하면 노란색 fold 버튼이 생깁니다. 이를 클릭하면 이하 모든 block들을 fold하여 보여줍니다.



input value : 빈 constant block을 클릭하면 input value modal이 뜹니다. 값을 입력하고, 엔터를 치거나 submit-value 버튼을 누르면 값이 입력됩니다.



delete & modify : block을 클릭하면 빨간색 delete 버튼이 나옵니다. delete 버튼을 누르면 해당 block이 사라집니다.
constant block을 클릭하면 초록색 modify 버튼이 나옵니다. modify 버튼을 누르면 input value modal이 떠서, 그 constant block의 value를 바꿀 수 있습니다.



open-palette : crafty-canvas 좌측 상단 + 버튼을 누르면 좌측의 palette가 열립니다. palette에는 기본 함수인 if, print, +, = 함수가 있고, 이를 drag해서 crafty-canvas 안에 drop하면 해당 함수가 생성됩니다.



compile : 우측 하단 > 버튼을 누르면 현재 crafty-canvas 및 crafty-editor의 코드들이 compile 되어 alert 됩니다.



drag & drop : crafty-canvas의 block들은 drag-and-drop 방식으로 이동, 분리, 합체할 수 있습니다. 모든 작업은 시행 직후 crafty-editor에 실시간으로 업데이트 됩니다.



error-message : crafty-editor에 코드를 작성하면 실시간으로 체크하여, 완성되지 않은 경우 error-message를 보여줍니다. error-message에서는 error가 발생한 간단한 이유를 알려줍니다.


## 소개 동영상

[![CRAFTY VIDEO](http://parkjunhyuk.com/crafty_logo.png)](https://youtu.be/5NUdw5i-3i8)
[CRAFTY VIDEO](https://youtu.be/5NUdw5i-3i8)

## 참조 오픈소스 

[PixiJS](http://www.pixijs.com/)

[Babel](https://babeljs.io/)

[Webpack](https://webpack.github.io/)

[NodeJS](https://nodejs.org/ko/)


## 라이센스
이 프로젝트는 MIT 라이센스를 따릅니다



